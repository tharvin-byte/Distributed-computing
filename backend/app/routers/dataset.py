from fastapi import APIRouter, File, HTTPException, Query, UploadFile
from typing import List, Dict, Any

from app.models import ItemAddRequest, DatasetGenerateRequest, DatasetInfo
from app.services import dataset_service

router = APIRouter(prefix="/api/dataset", tags=["Dataset"])


@router.get("/items", response_model=List[str])
def list_items():
    return dataset_service.get_items()


@router.post("/items", response_model=List[str])
def add_item(payload: ItemAddRequest):
    return dataset_service.add_item(payload.item)


@router.delete("/items/{item}", response_model=List[str])
def delete_item(item: str):
    return dataset_service.remove_item(item)


@router.get("/list", response_model=List[Dict[str, Any]])
def list_datasets():
    return dataset_service.list_available_datasets()


@router.get("/info", response_model=DatasetInfo)
def get_dataset_info(name: str = Query("csv_dataset_sample.csv", description="Name of the dataset")):
    try:
        return dataset_service.get_dataset_info(name)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read dataset: {e}")


@router.post("/generate", response_model=DatasetInfo)
def generate_dataset(payload: DatasetGenerateRequest):
    try:
        return dataset_service.generate_dataset(payload.rows)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset generation failed: {e}")


@router.post("/upload", response_model=DatasetInfo)
async def upload_dataset(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing file name")
    suffix = file.filename.lower()
    if not (suffix.endswith(".csv") or suffix.endswith(".json") or suffix.endswith(".txt")):
        raise HTTPException(status_code=400, detail="Only CSV, JSON, and TXT files are supported.")
    try:
        content = await file.read()
        return dataset_service.save_uploaded_dataset(file.filename, content)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid file contents: {e}")

