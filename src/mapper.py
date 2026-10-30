#!/usr/bin/env python3
import argparse
import csv
import itertools
import json
import sys
from pathlib import Path


def load_discarded(path):
    try:
        raw = json.loads(Path(path).read_text(encoding="utf-8"))
        return {tuple(item) for item in raw if isinstance(item, list)}
    except (OSError, json.JSONDecodeError, TypeError, ValueError):
        return set()


def parse_transaction(line, input_format):
    values = json.loads(line) if input_format == "json" else next(csv.reader([line]))
    if not isinstance(values, list):
        raise ValueError("JSON transaction must be an array")
    return sorted({str(value).strip() for value in values if str(value).strip()})


def main():
    parser = argparse.ArgumentParser(description="Generate Apriori candidates for Hadoop Streaming")
    parser.add_argument("--itemset-length", type=int, required=True)
    parser.add_argument("--discarded-file", default="discarded_items.json")
    parser.add_argument("--input-format", choices=("csv", "json"), default="csv")
    args = parser.parse_args()
    if args.itemset_length < 1:
        parser.error("--itemset-length must be at least 1")
    discarded = load_discarded(args.discarded_file)
    for raw_line in sys.stdin:
        line = raw_line.strip()
        if not line:
            continue
        try:
            transaction = parse_transaction(line, args.input_format)
        except (csv.Error, ValueError, json.JSONDecodeError) as error:
            print("Skipping malformed transaction: %s" % error, file=sys.stderr)
            continue
        for itemset in itertools.combinations(transaction, args.itemset_length):
            if any(set(infrequent).issubset(itemset) for infrequent in discarded):
                continue
            print("%s\t1" % json.dumps(itemset, separators=(",", ":")))


if __name__ == "__main__":
    main()
