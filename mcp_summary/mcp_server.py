from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from opensearchpy import OpenSearch, OpenSearchWarning
import asyncio
from typing import Any, Dict, List
from fastapi.middleware.cors import CORSMiddleware
import warnings
from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from fastapi.concurrency import run_in_threadpool

app = FastAPI()
# Allow requests from the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )
class ESQueryRequest(BaseModel):
    es_url: str
    es_index: str
    username: str
    password: str
    start_date: str
    end_date: str
    size: Optional[int] = 10
    offset: Optional[int] = 0
    filters: Optional[Dict[str, List[str]]] = None
    group_by: Optional[str] = "scenario_type"

class MCPBase:
    def __init__(self, es_url: str, username: str, password: str, es_index: str):
        self.index = es_index
        print("Trying for Connection")
        warnings.filterwarnings("ignore", category=OpenSearchWarning)
        try:
            self.client = OpenSearch(
                hosts=[es_url],
                http_auth=(username, password) if username and password else None,
                use_ssl=False,
                verify_certs=False
            )
            print("Created OpenSearch client")
        except Exception as e:
            print("OpenSearch error:", e)
            raise HTTPException(status_code=500, detail=f"OpenSearch error: {e}")


    async def query_es(self, query: Dict[str, Any]):
        resp = self.client.search(index=self.index, body=query)
        return resp.get("aggregations", {})
    
    def _date_filter(self) -> Dict[str, Any]:
        """Helper to apply range filter when start/end date is provided"""
        if self.start_date and self.end_date:
            return {
                "range": {
                    "timestamp": {
                        "gte": self.start_date,
                        "lte": self.end_date
                    }
                }
            }
        return {}


def normalize_date_histogram(aggs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Flatten date histogram results"""
    results = []
    for bucket in aggs.get("runs_per_day", {}).get("buckets", []):
        entry = {"date": bucket["key_as_string"]}
        for status_bucket in bucket["by_status"]["buckets"]:
            entry[status_bucket["key"]] = status_bucket["doc_count"]
        results.append(entry)
    return results


def normalize_terms_with_status(aggs: Dict[str, Any], field_name: str) -> List[Dict[str, Any]]:
    """Flatten terms aggregations with by_status sub-aggs"""
    results = []
    for bucket in aggs.get(field_name, {}).get("buckets", []):
        entry = {"key": bucket["key"], "total": bucket["doc_count"]}
        for status_bucket in bucket.get("by_status", {}).get("buckets", []):
            entry[status_bucket["key"]] = status_bucket["doc_count"]
        results.append(entry)
    return results


def normalize_summary_counts(aggs: Dict[str, Any]) -> Dict[str, int]:
    """Flattens the summary counts aggregation"""
    results = {"total_runs": 0,"success": 0, "failure": 0, "pass_rate": 0}
    for bucket in aggs.get("summary", {}).get("buckets", []):
        if bucket.get("key_as_string") == "true":
            results["success"] = bucket.get("doc_count", 0)
        elif bucket.get("key_as_string") == "false":
            results["failure"] = bucket.get("doc_count", 0)
    results["total_runs"] = results.get("success", 0) + results.get("failure", 0)
    
    if results["total_runs"] > 0:
        pass_rate_float = (results["success"] / results["total_runs"]) * 100    
        rounded_rate = round(pass_rate_float, 2)    
        pass_rate_string = str(rounded_rate) + "%"
    else:
        pass_rate_string = "0.00%"

    results["pass_rate"] = pass_rate_string
    return results


def normalize_top_failures(aggs: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Flatten top failure aggregation"""
    results = []
    for bucket in aggs.get("top_failures", {}).get("buckets", []):
        results.append({
            "scenario_type": bucket["key"],
            "failures": bucket["doc_count"]
        })
    return results

def normalize_comparison_summary(aggs: dict, group_by: str) -> dict:
    """
    Normalize the OpenSearch aggregation response for comparison view.
    Returns data grouped by the selected 'group_by' field and includes
    sub-aggregations for other dimensions (scenario_type, cloud_type, etc.).
    """
    result = {
        "group_by": group_by,
        "groups": []
    }

    # top-level group buckets
    for bucket in aggs.get("group_by", {}).get("buckets", []):
        group_data = {
            "key": bucket["key"],
            "total": bucket["doc_count"],
            "success": 0,
            "failure": 0,
            "sub_groups": {}
        }

        # --- summarize job_status for this group ---
        for status_bucket in bucket.get("by_status", {}).get("buckets", []):
            status = status_bucket["key_as_string"]
            count = status_bucket["doc_count"]
            if status.lower() in ["1", "success", "passed", "true"]:
                group_data["success"] += count
            else:
                group_data["failure"] += count

        # --- collect all other sub-groups (e.g. scenario_type, cloud_type, cloud_infra) ---
        for sub_group_name, sub_group_data in bucket.items():
            if sub_group_name in ["key", "doc_count", "by_status"]:
                continue

            sub_group_list = []
            for sub_bucket in sub_group_data.get("buckets", []):
                sub_item = {
                    "key": sub_bucket["key"],
                    "total": sub_bucket["doc_count"],
                    "success": 0,
                    "failure": 0
                }

                for s in sub_bucket.get("by_status", {}).get("buckets", []):
                    s_key = s["key_as_string"]
                    s_count = s["doc_count"]
                    if s_key.lower() in ["1", "success", "passed", "true"]:
                        sub_item["success"] += s_count
                    else:
                        sub_item["failure"] += s_count

                sub_group_list.append(sub_item)

            group_data["sub_groups"][sub_group_name] = sub_group_list

        result["groups"].append(group_data)

    return result

class SummaryQueries(MCPBase):
    def __init__(self, req: ESQueryRequest):
        super().__init__(
            es_url=req.es_url,
            username=req.username,
            password=req.password,
            es_index=req.es_index
        )
        self.start_date = req.start_date
        self.end_date = req.end_date
        self.filters = req.filters
    
    def _construct_filter_query(self, extra_must_clauses=None):
        query = {
            "bool": {
                "filter": [],
                "should": [],
                "must": []
            }
        }

        # 1. Add date range to the filter context
        if self.start_date and self.end_date:
            query["bool"]["filter"].append({
                "range": {
                    "timestamp": {
                        "gte": self.start_date,
                        "lte": self.end_date
                    }
                }
            })

        # 2. Build the should clauses from dynamic filters
        num_filter_keys = 0
        if self.filters:
            for field, values in self.filters.items():
                if values:
                    num_filter_keys += 1
                    query['bool']['should'].append({
                        "bool": {
                            "should": [{"match": {f"{field}.keyword": value}} for value in values],
                            "minimum_should_match": 1
                        }
                    })

        if num_filter_keys > 0:
            query["bool"]["minimum_should_match"] = num_filter_keys
        else:
            # No filters, so no should clause needed
            query["bool"].pop("should", None)
            query["bool"].pop("minimum_should_match", None)

        # 3. Add any extra must clauses (like job_status=false)
        if extra_must_clauses:
            query["bool"]["must"].extend(extra_must_clauses)
        
        # 4. Clean up empty clauses for a tidy query
        if not query["bool"]["filter"]:
            query["bool"].pop("filter", None)
        if not query["bool"]["must"]:
            query["bool"].pop("must", None)
            
        return query

    async def get_runs_per_day(self):
        query = {
            "size": 0,
            "query": self._construct_filter_query(),
            "aggs": {
                "runs_per_day": {
                    "date_histogram": {
                        "field": "timestamp",
                        "calendar_interval": "day",
                        "format": "yyyy-MM-dd"
                    },
                    "aggs": {"by_status": {"terms": {"field": "job_status"}}}
                }
            }
        }
        aggs = await self.query_es(query)
        return normalize_date_histogram(aggs)

    async def get_scenario_summary(self):
        query = {
            "size": 0,
            "query": self._construct_filter_query(),
            "aggs": {
                "scenario_type": {
                    "terms": {"field": "scenarios.scenario_type.keyword", "size": 10},
                    "aggs": {"by_status": {"terms": {"field": "job_status"}}}
                }
            }
        }
        aggs = await self.query_es(query)
        return normalize_terms_with_status(aggs, "scenario_type")

    async def get_cloud_summary(self):
        query = {
            "size": 0,
            "query": self._construct_filter_query(),
            "aggs": {
                "cloud_type": {
                    "terms": {"field": "cloud_type.keyword", "size": 10},
                    "aggs": {"by_status": {"terms": {"field": "job_status"}}}
                },
                "cloud_infra": {
                    "terms": {"field": "cloud_infrastructure.keyword", "size": 10},
                    "aggs": {"by_status": {"terms": {"field": "job_status"}}}
                }
            }
        }
        aggs = await self.query_es(query)
        cloud_type = normalize_terms_with_status(aggs, "cloud_type")
        cloud_infra = normalize_terms_with_status(aggs, "cloud_infra")
        return {"cloud_type": cloud_type, "cloud_infra": cloud_infra}

    async def get_major_version_summary(self):
        query = {
            "size": 0,
            "query": self._construct_filter_query(),
            "aggs": {
                "major_version": {
                    "terms": {"field": "major_version.keyword", "size": 10},
                    "aggs": {"by_status": {"terms": {"field": "job_status"}}}
                }
            }
        }
        aggs = await self.query_es(query)
        return normalize_terms_with_status(aggs, "major_version")
    
    async def overall_summary(self):
        query = {
            "size": 0,
            "query": self._construct_filter_query(),
            "aggs": {
                "status": {
                    "terms": {"field": "job_status", "size": 10},
                }
            }
        }
        aggs = await self.query_es(query)
        return normalize_terms_with_status(aggs, "status")

    async def get_summary_counts(self):
        query = {
            "size": 0,
            "query": self._construct_filter_query(),
            "aggs": {
                "summary": {
                    "terms": {"field": "job_status"}
                }
            }
        }
        aggs = await self.query_es(query)
        return normalize_summary_counts(aggs)

    async def get_top_failures(self):
        query = self._construct_filter_query(
            extra_must_clauses=[{"term": {"job_status": "false"}}]
        )
        
        aggs_query = {
            "size": 0,
            "query": query,
            "aggs": {
                "top_failures": {
                    "terms": {
                        "field": "scenarios.scenario_type.keyword",
                        "size": 10,
                        "order": {"_count": "desc"}
                    }
                }
            }
        }
        aggs = await self.query_es(aggs_query)
        return normalize_top_failures(aggs)
    
    async def get_comparison_summary(self, group_by: str):
        # Array of valid short names for grouping
        valid_fields = ["major_version", "cloud_type", "cloud_infra", "scenario_type"]

        if group_by not in valid_fields:
            raise ValueError(f"Invalid group_by field: {group_by}")

        # Helper to get the full keyword field name
        def get_full_field_name(field):
            if field == "scenario_type":
                return "scenarios.scenario_type.keyword"
            if field == "cloud_infra":
                return "cloud_infrastructure.keyword"
            return f"{field}.keyword"

        # Get the main field for grouping
        group_by_full_field = get_full_field_name(group_by)

        # Create a dictionary of sub-groups
        sub_groups = {
            field: get_full_field_name(field)
            for field in valid_fields
            if field != group_by
        }

        query = {
            "size": 0,
            "query": self._construct_filter_query(),
            "aggs": {
                "group_by": {
                    "terms": {"field": group_by_full_field, "size": 10},
                    "aggs": {
                        "by_status": {
                            "terms": {"field": "job_status"}
                        },
                        # Dynamically create aggregations for all other fields
                        **{
                            name: {
                                "terms": {"field": full_name, "size": 10},
                                "aggs": {
                                    "by_status": {
                                        "terms": {"field": "job_status"}
                                    }
                                }
                            }
                            for name, full_name in sub_groups.items()
                        }
                    }
                }
            }
        }
        aggs = await self.query_es(query)
        return normalize_comparison_summary(aggs, group_by)
		
class FailureAlerts(MCPBase):
    def __init__(self, req: ESQueryRequest):
        super().__init__(
            es_url=req.es_url,
            username=req.username,
            password=req.password,
            es_index=req.es_index
        )
        self.start_date = req.start_date
        self.end_date = req.end_date

    async def get_failure_alerts(self, size: int, offset: int):
        import traceback
        print("--- In get_failure_alerts ---")
        try:
            # First, get the UUIDs of failed runs
            failed_runs_query = {
                "size": 10,
                "_source": ["run_uuid", "scenarios.scenario_type"],
                "query": {
                    "bool": {
                        "must": [{"term": {"job_status": "false"}}],
                        "filter": [self._date_filter()]
                    }
                }
            }
            print("1. Querying for failed runs:", failed_runs_query)
            
            # Use run_in_threadpool to run the synchronous search call in a separate thread
            # failed_runs_response = await run_in_threadpool(self.client.search, index=self.index, body=failed_runs_query)
            failed_runs_response = self.client.search(index=self.index, body=failed_runs_query)
            print("2. Response from failed runs query:", failed_runs_response)
            
            # Extract run_uuids and map them to scenario_types
            run_info = {hit["_source"]["run_uuid"]: hit["_source"]["scenarios"][0]["scenario_type"] for hit in failed_runs_response.get("hits", {}).get("hits", [])}
            run_uuids = list(run_info.keys())
            print("3. Extracted run UUIDs:", run_uuids)

            if not run_uuids:
                return {"total": 0, "alerts": []}

            # Now, query the alerts index for these UUIDs
            alerts_query = {
                    "query": {
                        "bool": {
                            "should": [{"match": {"run_uuid": uuid}} for uuid in run_uuids],
                            "minimum_should_match": 1,
                            "must": [{"range": {"created_at": {"gte": "2024-01-01"}}}]
                        }
                    },
                    "sort": [{"created_at": {"order": "desc"}}],
                    "_source": ["run_uuid", "alert", "severity", "created_at"],
                    "size": 10000
                }
            print("4. Querying for alerts with UUIDs:", alerts_query)
            
            # Querying the alerts, assuming a different index for alerts, e.g., 'krkn-alerts'
            alerts_response = await run_in_threadpool(self.client.search, index='krkn-alerts', body=alerts_query)
           
            
            total_alerts = alerts_response.get("hits", {}).get("total", {}).get("value", 0)
            alerts_hits = alerts_response.get("hits", {}).get("hits", [])
            
            # Format the alerts with their corresponding scenario_type
            formatted_alerts = []
            for hit in alerts_hits:
                alert_data = hit["_source"]
                run_uuid = alert_data.get("run_uuid")
                scenario_type = run_info.get(run_uuid, "Unknown Scenario") # Default to a string if not found
                
                # Ensure all relevant fields are present
                formatted_alert = {
                    "run_uuid": run_uuid,
                    "scenario_type": scenario_type,
                    "alert": alert_data.get("alert", "N/A"),
                    "severity": alert_data.get("severity", "N/A"),
                    "created_at": alert_data.get("created_at", "N/A")
                }
                formatted_alerts.append(formatted_alert)

            print("6. Final formatted alerts being returned:", formatted_alerts)
            return {"total": total_alerts, "alerts": formatted_alerts}
        except Exception as e:
            print(f"!!! EXCEPTION in get_failure_alerts: {e}")
            traceback.print_exc()
            raise HTTPException(status_code=500, detail="Internal server error during alert processing.")


@app.post("/alerts")
async def alerts(req: ESQueryRequest):
    client = FailureAlerts(req)
    print("what happened here to you")
    alerts = await client.get_failure_alerts(req.size, req.offset)
    return alerts


@app.post("/analyze")
async def analyze(req: ESQueryRequest):    
    client = SummaryQueries(req)
    summary, runs_per_day, scenario, cloud, version, top_failures = await asyncio.gather(
        client.get_summary_counts(),
        client.get_runs_per_day(),
        client.get_scenario_summary(),
        client.get_cloud_summary(),
        client.get_major_version_summary(),
        client.get_top_failures()
    )
    
    
    
    return {
        "summary": summary,
        "runs_per_day": runs_per_day,
        "scenario_type": scenario,
        "cloud_type": cloud.get("cloud_type", []),
        "cloud_infra": cloud.get("cloud_infra", []),
        "major_version": version,
        "top_failures": top_failures
    }
@app.post("/comparison")
async def comparison(req: ESQueryRequest):
    client = SummaryQueries(req)
    result = await client.get_comparison_summary(req.group_by)
    return result
