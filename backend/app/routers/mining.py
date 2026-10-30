from fastapi import APIRouter, HTTPException
from typing import List

from app.models import MiningParams, MiningJobStatus, AssociationRule
from app.services import apriori_runner

router = APIRouter(prefix="/api/mining", tags=["Mining"])


@router.post("/run", response_model=MiningJobStatus)
def trigger_mining(params: MiningParams):
    try:
        return apriori_runner.start_mining_job(params)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not start mining job: {e}")


@router.get("/status/{job_id}", response_model=MiningJobStatus)
def get_job_status(job_id: str):
    job = apriori_runner.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    return job


@router.get("/rules/{job_id}", response_model=List[AssociationRule])
def get_job_rules(job_id: str):
    job = apriori_runner.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found.")
    return job.rules

