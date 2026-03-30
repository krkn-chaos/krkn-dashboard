from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, List, Any
from opensearchpy import AsyncOpenSearch, OpenSearchWarning
import warnings
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import statistics
import warnings

app = FastAPI()

# Allow requests from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ESQueryRequest(BaseModel):
    es_url: str
    es_index: str
    username: str
    password: str
    start_date: str
    end_date: str
    size: int
    offset: int
    query: Dict[str, Any]

class SummaryResponse(BaseModel):
    summary: Dict[str, Any]
    runs_per_day: List[Dict[str, Any]]
    failure_reasons: List[Dict[str, Any]]
    durations: List[float]
    runs_by_version: List[Dict[str, Any]]
    runs_by_cloud_type: List[Dict[str, Any]]
    runs_by_cloud_infra: List[Dict[str, Any]]
    aggregations: Dict[str, Any]

def parse_generic_aggregations_with_totals(aggregations: dict) -> dict:
    def extract_status(buckets):
        status = {"success": 0, "failure": 0}
        for b in buckets:
            if b.get("key_as_string") == "true":
                status["success"] = b.get("doc_count", 0)
            elif b.get("key_as_string") == "false":
                status["failure"] = b.get("doc_count", 0)
        return status

    parsed = {
        "total": extract_status(aggregations.get("job_status", {}).get("buckets", []))
    }

    for agg_key, agg_data in aggregations.items():
        # Skip the top-level job_status (already used for total)
        if agg_key == "job_status":
            continue

        buckets = agg_data.get("buckets", [])
        parsed[agg_key] = {}

        for bucket in buckets:
            key = bucket.get("key")
            job_status_buckets = bucket.get("job_status", {}).get("buckets", [])
            parsed[agg_key][key] = extract_status(job_status_buckets)

    return parsed


@app.post("/analyze", response_model=SummaryResponse)

async def analyze(req: ESQueryRequest):
    
    if 'index' in req.query:
        del req.query['index']

    warnings.filterwarnings("ignore", category=OpenSearchWarning)

    try:
        client = AsyncOpenSearch(
            hosts=[req.es_url],
            http_auth=(req.username, req.password),
            use_ssl=True,
            verify_certs=False,
        )
        print("Created OpenSearch client")

        # Test connectivity
        if await client.ping():
            print("Ping successful")
        else:
            print("Ping failed")
        print(req.query)
        # Execute search
        result = await client.search(index=req.es_index, body=req.query, size=req.size, from_=req.offset if hasattr(req, "offset") else 0,)
        

    except Exception as e:
        print("OpenSearch error:", e)
        raise HTTPException(status_code=500, detail=f"OpenSearch error: {e}")

    finally:
        await client.close()
    
    
    major_hits = result.get("hits", {})

    hits = major_hits.get("hits", [])
    if not hits:
        raise HTTPException(status_code=404, detail="No data found")

    total = major_hits.get("total", {}).get("value", 0)
    durations = []
    dates = []
    runs_per_day = {}
    failure_reasons = {}
    runs_by_version = {}
    runs_by_cloud_type = {}
    runs_by_cloud_infra = {}

    for hit in hits:
        src = hit["_source"]

        # Duration
        health_checks = src.get("health_checks")
        if health_checks and isinstance(health_checks, list):
            for check in health_checks:
                if "duration" in check:
                    durations.append(check["duration"])

        # Version
        version = src.get("major_version")
        if version:
            runs_by_version[version] = runs_by_version.get(version, 0) + 1

        # Cloud Type
        cloud_type = src.get("cloud_type")
        if cloud_type:
            runs_by_cloud_type[cloud_type] = runs_by_cloud_type.get(cloud_type, 0) + 1
        
        # Cloud Infra
        cloud_infra = src.get("cloud_infrastructure")
        if cloud_infra:
            runs_by_cloud_type[cloud_infra] = runs_by_cloud_infra.get(cloud_infra, 0) + 1

    
    aggs = result.get("aggregations", {})
  
    parsed_aggregations = parse_generic_aggregations_with_totals(aggs)
    job_status_bucket = parsed_aggregations.get("total", {})
    
    summary = {
        "total_runs": total,
        "passed": job_status_bucket.get("success", 0),
        "failed": job_status_bucket.get("failure", 0),
        "pass_rate": round(job_status_bucket.get("success", 0) / total * 100, 2) if total > 0 else 0.0,
        # "average_duration": round(statistics.mean(durations), 2) if durations else 0,
        # "min_duration": min(durations) if durations else 0,
        # "max_duration": max(durations) if durations else 0,
        # "date_range": [min(dates), max(dates)] if dates else [],
    }

    return {
        "summary": summary,
        "runs_per_day": [{"date": k, **v} for k, v in sorted(runs_per_day.items())],
        "failure_reasons": [{"reason": k, "count": v} for k, v in failure_reasons.items()],
        "durations": durations,
        "runs_by_version": [{"version": k, "count": v} for k, v in runs_by_version.items()],
        "runs_by_cloud_type": [{"cloud_type": k, "count": v} for k, v in runs_by_cloud_type.items()],
        "runs_by_cloud_infra": [{"cloud_infra": k, "count": v} for k, v in runs_by_cloud_infra.items()],
        "aggregations": parsed_aggregations,
    }
