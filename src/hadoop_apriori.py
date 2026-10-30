#!/usr/bin/env python3
"""Run the Apriori workflow as sequential Hadoop Streaming jobs."""

import argparse
import json
import os
import subprocess
import tempfile
from pathlib import Path


def command_output(command):
    return subprocess.check_output(command, text=True, stderr=subprocess.PIPE)


def run_job(args, pass_number, discarded_file, output_path):
    output_path = str(output_path)
    subprocess.run([args.hadoop_bin, "fs", "-rm", "-r", "-f", output_path], check=False,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    mapper = f"python3 mapper.py --itemset-length {pass_number} --discarded-file discarded_items.json --input-format {args.input_format}"
    reducer = f"python3 reducer.py --minimum-support {args.minimum_support}"
    command = [args.hadoop_bin, "jar", args.streaming_jar,
               "-D", "mapreduce.job.name=market-basket-apriori-pass-%d" % pass_number,
               "-D", "mapreduce.job.reduces=%d" % args.reducers,
               "-input", args.input,
               "-output", output_path,
               "-mapper", mapper, "-reducer", reducer,
               "-files", "%s,%s,%s" % (args.mapper, args.reducer, discarded_file)]
    subprocess.run(command, check=True)


def read_results(args, output_path):
    text = command_output([args.hadoop_bin, "fs", "-cat", f"{output_path}/part-*"])
    frequent, discarded = [], []
    for line in text.splitlines():
        parts = line.split("\t")
        if len(parts) != 3:
            continue
        category, raw_itemset, raw_count = parts
        try:
            itemset, count = json.loads(raw_itemset), int(raw_count)
        except (ValueError, json.JSONDecodeError):
            continue
        record = {"itemset": itemset, "support": count}
        (frequent if category == "frequent" else discarded).append(record)
    return frequent, discarded


def main():
    parser = argparse.ArgumentParser(description="Mine frequent itemsets with Hadoop MapReduce")
    parser.add_argument("input", help="HDFS path to one-transaction-per-line CSV or JSON input")
    parser.add_argument("--output", default="market-basket-apriori", help="HDFS output directory")
    parser.add_argument("--minimum-support", type=int, default=250)
    parser.add_argument("--max-itemset-length", type=int, default=20)
    parser.add_argument("--input-format", choices=("csv", "json"), default="csv")
    parser.add_argument("--reducers", type=int, default=1)
    parser.add_argument("--hadoop-bin", default=os.environ.get("HADOOP_BIN", "hadoop"))
    parser.add_argument("--streaming-jar", default=os.environ.get("HADOOP_STREAMING_JAR", ""))
    args = parser.parse_args()
    if not args.streaming_jar:
        parser.error("--streaming-jar or HADOOP_STREAMING_JAR is required")
    if args.minimum_support < 1 or args.max_itemset_length < 1 or args.reducers < 1:
        parser.error("support, maximum length, and reducers must be positive")

    args.mapper = Path(__file__).resolve().with_name("mapper.py")
    args.reducer = Path(__file__).resolve().with_name("reducer.py")
    with tempfile.TemporaryDirectory(prefix="hadoop-apriori-") as state_dir:
        discarded_file = Path(state_dir) / "discarded_items.json"
        discarded_file.write_text("[]", encoding="utf-8")
        all_frequent = []
        for pass_number in range(1, args.max_itemset_length + 1):
            run_job(args, pass_number, discarded_file, f"{args.output}/pass-{pass_number}")
            frequent, newly_discarded = read_results(args, f"{args.output}/pass-{pass_number}")
            all_frequent.extend(frequent)
            if not frequent:
                break
            previous = json.loads(discarded_file.read_text(encoding="utf-8"))
            previous.extend(item["itemset"] for item in newly_discarded)
            discarded_file.write_text(json.dumps(previous), encoding="utf-8")
    print(json.dumps({"frequent_itemsets": all_frequent}, indent=2))


if __name__ == "__main__":
    main()
