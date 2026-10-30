import csv
import json
import random
from pathlib import Path
from typing import List, Tuple, Dict, Any

from app.models import DatasetInfo

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATASET_GEN_DIR = PROJECT_ROOT / "dataset_generator"
ITEMS_FILE = DATASET_GEN_DIR / "items" / "item_list.json"
SAMPLE_ITEMS_FILE = DATASET_GEN_DIR / "items" / "item_list_sample.json"
DATASET_DIR = DATASET_GEN_DIR / "dataset"
UPLOADS_DIR = PROJECT_ROOT / "backend" / "uploads"


def ensure_dirs():
    ITEMS_FILE.parent.mkdir(parents=True, exist_ok=True)
    DATASET_DIR.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def get_items() -> List[str]:
    ensure_dirs()
    if ITEMS_FILE.exists():
        try:
            return json.loads(ITEMS_FILE.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            pass
    if SAMPLE_ITEMS_FILE.exists():
        try:
            items = json.loads(SAMPLE_ITEMS_FILE.read_text(encoding="utf-8"))
            ITEMS_FILE.write_text(json.dumps(items, indent=4), encoding="utf-8")
            return items
        except (json.JSONDecodeError, OSError):
            pass
    return []


def add_item(item: str) -> List[str]:
    ensure_dirs()
    cleaned = item.strip()
    if not cleaned:
        return get_items()
    items = get_items()
    if cleaned not in items:
        items.append(cleaned)
        ITEMS_FILE.write_text(json.dumps(items, indent=4), encoding="utf-8")
    return items


def remove_item(item: str) -> List[str]:
    ensure_dirs()
    items = get_items()
    if item in items:
        items.remove(item)
        ITEMS_FILE.write_text(json.dumps(items, indent=4), encoding="utf-8")
    return items


def generate_dataset(rows: int) -> DatasetInfo:
    ensure_dirs()
    items = get_items()
    if not items:
        raise ValueError("Cannot generate dataset: item list is empty. Add items first.")

    itemcount = len(items)
    data = []
    for _ in range(rows):
        count = random.randint(1, min(itemcount, 8))
        data_item = [random.choice(items) for _ in range(count)]
        data.append(data_item)

    # Save JSON dataset
    json_path = DATASET_DIR / "dataset.json"
    json_path.write_text(json.dumps(data, indent=4), encoding="utf-8")

    # Save CSV dataset
    csv_path = DATASET_DIR / "csv_dataset.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as csvfile:
        csv.writer(csvfile).writerows(data)

    return get_dataset_info("csv_dataset.csv")


def resolve_dataset_path(dataset_name: str) -> Path:
    # Check uploads directory first
    if (UPLOADS_DIR / dataset_name).exists():
        return UPLOADS_DIR / dataset_name
    # Check dataset_generator/dataset/
    if (DATASET_DIR / dataset_name).exists():
        return DATASET_DIR / dataset_name
    # Fallback to sample
    if (DATASET_DIR / "csv_dataset_sample.csv").exists():
        return DATASET_DIR / "csv_dataset_sample.csv"
    raise FileNotFoundError(f"Dataset '{dataset_name}' not found.")


def get_dataset_info(dataset_name: str) -> DatasetInfo:
    path = resolve_dataset_path(dataset_name)
    transactions: List[List[str]] = []
    unique_items_set = set()

    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text(encoding="utf-8"))
        for row in data:
            if isinstance(row, list):
                cleaned = sorted({str(x).strip() for x in row if str(x).strip()})
                if cleaned:
                    transactions.append(cleaned)
                    unique_items_set.update(cleaned)
    else:
        with path.open(encoding="utf-8") as f:
            for row in csv.reader(f):
                cleaned = sorted({str(x).strip() for x in row if str(x).strip()})
                if cleaned:
                    transactions.append(cleaned)
                    unique_items_set.update(cleaned)

    sample = transactions[:10]
    return DatasetInfo(
        dataset_name=path.name,
        total_transactions=len(transactions),
        unique_items_count=len(unique_items_set),
        sample_transactions=sample,
        unique_items=sorted(list(unique_items_set))
    )


def list_available_datasets() -> List[Dict[str, Any]]:
    ensure_dirs()
    datasets = []
    # Known dataset files
    candidates = [
        DATASET_DIR / "csv_dataset_sample.csv",
        DATASET_DIR / "csv_dataset.csv",
        DATASET_DIR / "dataset_sample.json",
        DATASET_DIR / "dataset.json",
    ]
    if UPLOADS_DIR.exists():
        candidates.extend(UPLOADS_DIR.glob("*.*"))

    seen = set()
    for p in candidates:
        if p.exists() and p.name not in seen:
            seen.add(p.name)
            try:
                info = get_dataset_info(p.name)
                datasets.append({
                    "name": p.name,
                    "size_bytes": p.stat().st_size,
                    "total_transactions": info.total_transactions,
                    "unique_items_count": info.unique_items_count
                })
            except Exception:
                continue
    return datasets


def save_uploaded_dataset(filename: str, content: bytes) -> DatasetInfo:
    ensure_dirs()
    clean_name = Path(filename).name
    save_path = UPLOADS_DIR / clean_name
    save_path.write_bytes(content)
    # Validate and return info
    return get_dataset_info(clean_name)

