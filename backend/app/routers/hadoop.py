from fastapi import APIRouter
from pathlib import Path
from typing import Dict, Any

router = APIRouter(prefix="/api/hadoop", tags=["Hadoop"])

PROJECT_ROOT = Path(__file__).resolve().parents[3]
SRC_DIR = PROJECT_ROOT / "src"


@router.get("/info", response_model=Dict[str, Any])
def get_hadoop_info():
    mapper_code = (SRC_DIR / "mapper.py").read_text(encoding="utf-8") if (SRC_DIR / "mapper.py").exists() else ""
    reducer_code = (SRC_DIR / "reducer.py").read_text(encoding="utf-8") if (SRC_DIR / "reducer.py").exists() else ""
    driver_code = (SRC_DIR / "hadoop_apriori.py").read_text(encoding="utf-8") if (SRC_DIR / "hadoop_apriori.py").exists() else ""

    return {
        "architecture": {
            "name": "Hadoop Streaming Multi-Pass Apriori",
            "execution_target": "Hadoop Distributed File System (HDFS) & YARN / MapReduce",
            "communication_model": "STDIN / STDOUT Unix Streaming Pipe",
            "streaming_utility": "hadoop-streaming-3.x.x.jar",
            "stages": [
                {
                    "step": 1,
                    "title": "HDFS Input Splitting",
                    "description": "Hadoop splits the raw CSV/JSON transaction file stored in HDFS into 128MB block splits across DataNodes. Each InputSplit feeds a parallel Mapper instance."
                },
                {
                    "step": 2,
                    "title": "Map Phase (mapper.py)",
                    "description": "Each mapper reads transaction lines from STDIN. It loads discarded_items.json (distributed via Hadoop's -files cache) and generates k-length item combinations, pruning any candidate containing a known infrequent subset. Emits '<itemset>\\t1'."
                },
                {
                    "step": 3,
                    "title": "Shuffle & Sort",
                    "description": "Hadoop framework partitions, transmits, and sorts intermediate <key, value> pairs by candidate key across nodes, guaranteeing all identical candidate itemsets reach the same Reducer."
                },
                {
                    "step": 4,
                    "title": "Reduce Phase (reducer.py)",
                    "description": "Reducers stream grouped <itemset>\\t1 pairs from STDIN, sums occurrences, filters against --minimum-support, and categorizes itemsets into 'frequent' or 'discarded'. Emits to HDFS part-* files."
                },
                {
                    "step": 5,
                    "title": "Sequential Multi-Pass Driver (hadoop_apriori.py)",
                    "description": "Apriori requires k-passes. The Python driver inspects HDFS part-* results after each pass, appends newly discarded itemsets to discarded_items.json, and submits pass k+1 via Hadoop Streaming with updated -files until no frequent itemsets remain."
                }
            ]
        },
        "scripts": {
            "mapper": {
                "filename": "mapper.py",
                "path": "src/mapper.py",
                "role": "Stateless worker generating candidate k-combinations and pruning infrequent itemsets via distributed cache",
                "code": mapper_code
            },
            "reducer": {
                "filename": "reducer.py",
                "path": "src/reducer.py",
                "role": "Stateless aggregator summing candidate key counts and tagging frequent vs discarded itemsets",
                "code": reducer_code
            },
            "driver": {
                "filename": "hadoop_apriori.py",
                "path": "src/hadoop_apriori.py",
                "role": "Sequential multi-pass orchestrator submitting jobs to Hadoop Streaming with -files distribution",
                "code": driver_code
            }
        }
    }

