import { Client } from "@opensearch-project/opensearch";
// import { Client } from '@elastic/elasticsearch';

export class ElasticsearchService {
  constructor({ clientOptions }) {
    this.client = new Client(clientOptions);
  }

  async fetchRunDetails(index, size = 25, start_date, end_date, offset = 0) {
    try {
      const info = await this.client.info();
      console.log("Connected to ES:", info);

      const ping = await this.client.ping();
      if (!ping) {
        throw new Error("Elasticsearch ping failed");
      }

      const result = await this.client.search({
        index: index ? index : "*",
        size,
        from: offset,
        body: {
          query: {
            bool: {
              filter: [
                {
                  range: {
                    timestamp: {
                      format: "yyyy-MM-dd",
                      gte: start_date,
                      lte: end_date,
                    },
                  },
                },
                {
                  match: {
                    "scenarios.scenario_type": "pod_disruption_scenarios",
                  },
                },
              ],
            },
          },
        },
      });

      // Parse and return only the required fields
      const parsedData = await Promise.all(
        result.body.hits.hits.map((hit) =>
          this.parseRunDetails(hit._source, hit._id)
        )
      );

      return {
        data: parsedData,
        pagination: {
          total: result.body.hits.total.value || result.body.hits.total,
          size: size,
          offset: offset,
          currentPage: Math.floor(offset / size) + 1,
          totalPages: Math.ceil(
            (result.body.hits.total.value || result.body.hits.total) / size
          ),
          hasNext:
            offset + size <
            (result.body.hits.total.value || result.body.hits.total),
          hasPrevious: offset > 0,
        },
      };
    } catch (error) {
      console.error("Elasticsearch fetch error:", error.meta || error);
      throw error;
    }
  }

  parseRunDetails(source, id) {
    const {
      timestamp,
      "@timestamp": atTimestamp,
      start_timestamp,
      end_timestamp,
      cloud_infrastructure,
      job_status,
      namespace,
      target_namespace,
      cloud_type,
      scenarios = [],
    } = source;

    const scenario = scenarios[0] || {};
    const parameters = scenario.parameters?.[0] || {};

    const parsedData = {
      id,
      timestamp: timestamp || atTimestamp || new Date().toISOString(),
      start_time: start_timestamp || new Date().toISOString(),
      end_time: end_timestamp || new Date().toISOString(),
      scenario_type: scenario.scenario_type || "unknown",
      status: scenario.exit_status || job_status || "unknown",
      namespace: namespace || target_namespace || "default",

      config: {
        id: parameters.id || "unknown",
        parameters: parameters.config || {},
        cloud_infrastructure,
        cloud_type,
      },

      affected_pods: [],
    };

    const affected = scenario.affected_pods || {};
    ["recovered", "unrecovered"].forEach((status) => {
      const pods = affected[status];
      if (Array.isArray(pods)) {
        pods.forEach((pod) => {
          const podEntry = {
            status,
            pod_name: pod.pod_name,
            namespace: pod.namespace,
          };

          if (status === "recovered") {
            podEntry.total_recovery_time = parseFloat(
              pod.total_recovery_time?.toFixed(2) || 0
            );
            podEntry.pod_readiness_time = parseFloat(
              pod.pod_readiness_time?.toFixed(2) || 0
            );
            podEntry.pod_rescheduling_time = parseFloat(
              pod.pod_rescheduling_time?.toFixed(2) || 0
            );

            podEntry.krkn_pod_recovery_time = parseFloat(
              parameters.config?.krkn_pod_recovery_time?.toFixed(2)
            );
          }

          parsedData.affected_pods.push(podEntry);
        });
      }
    });

    return parsedData;
  }
}
