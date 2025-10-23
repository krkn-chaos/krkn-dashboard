// mcpClient.js

import axios from "axios";

/**
 * Calls the MCP FastAPI analysis endpoint
 * @param {Object} params
 * @param {string} params.es_url - Elasticsearch URL
 * @param {string} params.es_index - Index to query
 * @param {string} params.username - ES username
 * @param {string} params.password - ES password
 * @param {Object} params.query - Elasticsearch DSL query
 * @param {string} [params.mcp_url] - MCP server URL (default: http://localhost:5000/analyze)
 * @returns {Promise<Object>} Parsed JSON response from MCP
 */
// export default async function fetchMcpAnalysis({
//   es_url,
//   username,
//   password,
//   es_index,
//   start_date,
//   end_date,
// size,
// offset,
//   mcp_url = 'http://localhost:5000/analyze'
// }) {
//   try {
//     console.log("I was called hee")
//     const query = {

//         query: {
//             bool: {
//                 filter: [
//                 {
//                     range: {
//                     timestamp: {
//                         format: "yyyy-MM-dd",
//                         gte: start_date,
//                         lte: end_date,
//                     },
//                     },
//                 },
//                 // {
//                 //     match: {
//                 //     "scenarios.scenario_type": "pod_disruption_scenarios",
//                 //     },
//                 // },
//                 ],
//             },
//         },
//         "aggs": {
//     "job_status": {
//       "terms": {
//         "field": "job_status",
//         "size": 10
//       }
//     },
//     "scenario_type": {
//       "terms": {
//         "field": "scenarios.scenario_type.keyword"
//       },
//       "aggs": {
//         "job_status": {
//           "terms": {
//             "field": "job_status"
//           }
//         }
//       }
//     },
//     "cloud_type": {
//       "terms": {
//         "field": "cloud_type.keyword"
//       },
//       "aggs": {
//         "job_status": {
//           "terms": {
//             "field": "job_status"
//           }
//         }
//       }
//     },
//      "cloud_infra": {
//       "terms": {
//         "field": "cloud_infrastructure.keyword"
//       },
//       "aggs": {
//         "job_status": {
//           "terms": {
//             "field": "job_status"
//           }
//         }
//       }
//     },
//      "major_version": {
//       "terms": {
//         "field": "major_version.keyword"
//       },
//       "aggs": {
//         "job_status": {
//           "terms": {
//             "field": "job_status"
//           }
//         }
//       }
//     }
//   }
//       }
//   //   const response = await axios.post(mcp_url, {
//   //     es_url,
//   //     es_index,
//   //     username,
//   //     password,
//   //     query,
//   //     start_date,
//   // end_date,
//   // size,
//   // offset,
//   //   });
//       // es_url="search-ocp-qe-perf-scale-test-elk-hcm7wtsqpxy7xogbu72bor4uve.us-east-1.es.amazonaws.com"
//       // es_index="krkn-telemetry"
//       // username="ocp-qe"
//       // password="Best-footballplayer-test8"
//       // start_date="2025-10-01"
//       // end_date="2025-10-05"
//   const response = await axios.post(mcp_url, {
//       es_url,
//       es_index,
//       username,
//       password,
//       query,
//       start_date,
//   end_date,
//   size,
//   offset,
//     });

//     return response.data;
//   } catch (error) {
//     console.error('MCP API error:', error.response?.data || error.message);
//     throw new Error('Failed to fetch MCP analysis data.');
//   }
// }

export const fetchMcpAnalysis = async (params) => {
	const { es_url, username, password, es_index, start_date, end_date } = params;
	const mcp_url = "http://localhost:5000/analyze";
	try {
		console.log("I'm called here");
		const response = await axios.post(mcp_url, {
			es_url,
			es_index,
			username,
			password,
			start_date,
			end_date,
			size: 100,
			offset: 0,
		});

		return response.data;
	} catch (error) {
		console.error("MCP API error:", error.response?.data || error.message);
		throw new Error("Failed to fetch MCP analysis data.");
	}
};
