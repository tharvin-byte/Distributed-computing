import json
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path
from typing import Dict, List, Tuple

from app.models import (
    MiningParams,
    MiningJobStatus,
    PassMetric,
    FrequentItemset,
    AssociationRule
)
from app.services.dataset_service import resolve_dataset_path
from app.services.rules_engine import generate_association_rules

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SRC_DIR = PROJECT_ROOT / "src"
MAPPER_SCRIPT = SRC_DIR / "mapper.py"
REDUCER_SCRIPT = SRC_DIR / "reducer.py"

# In-memory storage for jobs
_JOBS: Dict[str, MiningJobStatus] = {}
_JOBS_LOCK = threading.Lock()


def get_job(job_id: str) -> MiningJobStatus | None:
    with _JOBS_LOCK:
        return _JOBS.get(job_id)


def _execute_pass(
    pass_number: int,
    input_text: str,
    input_format: str,
    min_support: int,
    discarded_path: Path
) -> Tuple[List[Tuple[List[str], int]], List[Tuple[List[str], int]], float]:
    start_time = time.time()

    # Step 1: Mapper
    mapper_cmd = [
        sys.executable,
        str(MAPPER_SCRIPT),
        "--itemset-length", str(pass_number),
        "--discarded-file", str(discarded_path),
        "--input-format", input_format
    ]
    mapper_proc = subprocess.Popen(
        mapper_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8"
    )
    map_out, map_err = mapper_proc.communicate(input=input_text)
    if mapper_proc.returncode != 0:
        raise RuntimeError(f"Mapper pass {pass_number} failed: {map_err}")

    # Step 2: Sort (emulating MapReduce shuffle/sort)
    lines = [line for line in map_out.splitlines() if line.strip()]
    lines.sort()
    sorted_input = "\n".join(lines) + ("\n" if lines else "")

    # Step 3: Reducer
    reducer_cmd = [
        sys.executable,
        str(REDUCER_SCRIPT),
        "--minimum-support", str(min_support)
    ]
    reducer_proc = subprocess.Popen(
        reducer_cmd,
        stdin=subprocess.PIPE,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
        encoding="utf-8"
    )
    red_out, red_err = reducer_proc.communicate(input=sorted_input)
    if reducer_proc.returncode != 0:
        raise RuntimeError(f"Reducer pass {pass_number} failed: {red_err}")

    frequent = []
    discarded = []
    for line in red_out.splitlines():
        parts = line.split("\t")
        if len(parts) == 3:
            cat, itemset_str, count_str = parts
            try:
                itemset = json.loads(itemset_str)
                count = int(count_str)
                if cat == "frequent":
                    frequent.append((itemset, count))
                else:
                    discarded.append((itemset, count))
            except (json.JSONDecodeError, ValueError):
                continue

    duration = time.time() - start_time
    return frequent, discarded, duration


def _run_mining_worker(job_id: str, params: MiningParams):
    try:
        dataset_path = resolve_dataset_path(params.dataset_name or "csv_dataset_sample.csv")
        input_format = "json" if dataset_path.suffix.lower() == ".json" else "csv"
        input_text = dataset_path.read_text(encoding="utf-8")

        # Count total transactions
        total_tx = sum(1 for line in input_text.splitlines() if line.strip())

        with _JOBS_LOCK:
            job = _JOBS[job_id]
            job.status = "running"
            job.total_transactions = total_tx

        import tempfile
        with tempfile.TemporaryDirectory(prefix=f"apriori-job-{job_id}-") as tmp_dir:
            discarded_file = Path(tmp_dir) / "discarded_items.json"
            discarded_list = []
            discarded_file.write_text("[]", encoding="utf-8")

            all_frequent_dict: Dict[Tuple[str, ...], int] = {}
            frequent_models: List[FrequentItemset] = []
            pass_metrics: List[PassMetric] = []

            for pass_num in range(1, params.max_itemset_length + 1):
                with _JOBS_LOCK:
                    job.current_pass = pass_num

                freq, disc, duration = _execute_pass(
                    pass_num,
                    input_text,
                    input_format,
                    params.min_support,
                    discarded_file
                )

                metric = PassMetric(
                    pass_number=pass_num,
                    frequent_count=len(freq),
                    discarded_count=len(disc),
                    duration_seconds=round(duration, 3)
                )
                pass_metrics.append(metric)

                for itemset, count in freq:
                    tup = tuple(sorted(itemset))
                    all_frequent_dict[tup] = count
                    supp_pct = round((count / total_tx) * 100, 2) if total_tx > 0 else 0.0
                    frequent_models.append(FrequentItemset(
                        itemset=itemset,
                        support=count,
                        support_pct=supp_pct,
                        length=len(itemset)
                    ))

                # Update live status
                with _JOBS_LOCK:
                    job.pass_metrics = list(pass_metrics)
                    job.frequent_itemsets = list(frequent_models)

                # Stop if no frequent itemsets discovered in this pass
                if not freq:
                    break

                # Update discarded items for next pass pruning
                discarded_list.extend([itemset for itemset, _ in disc])
                discarded_file.write_text(json.dumps(discarded_list), encoding="utf-8")

            # Generate association rules
            rules = generate_association_rules(
                all_frequent_dict,
                total_tx,
                params.min_confidence
            )

            with _JOBS_LOCK:
                job.rules = rules
                job.status = "completed"

    except Exception as e:
        with _JOBS_LOCK:
            job = _JOBS.get(job_id)
            if job:
                job.status = "failed"
                job.error = str(e)


def start_mining_job(params: MiningParams) -> MiningJobStatus:
    job_id = str(uuid.uuid4())[:8]
    job = MiningJobStatus(
        job_id=job_id,
        status="pending",
        current_pass=0,
        total_transactions=0,
        pass_metrics=[],
        frequent_itemsets=[],
        rules=[]
    )
    with _JOBS_LOCK:
        _JOBS[job_id] = job

    thread = threading.Thread(target=_run_mining_worker, args=(job_id, params), daemon=True)
    thread.start()
    return job

