#!/usr/bin/env python3
import argparse
import sys
import json


def main():
    parser = argparse.ArgumentParser(description="Count Apriori candidates in Hadoop Streaming")
    parser.add_argument("--minimum-support", type=int, required=True)
    args = parser.parse_args()
    if args.minimum_support < 1:
        parser.error("--minimum-support must be at least 1")

    current_key = None
    current_count = 0

    def emit(key, count):
        if key is None:
            return
        try:
            itemset = json.loads(key)
            if not isinstance(itemset, list):
                raise ValueError
        except (json.JSONDecodeError, ValueError):
            print("Skipping malformed mapper key: %s" % key, file=sys.stderr)
            return
        category = "frequent" if count >= args.minimum_support else "discarded"
        print("%s\t%s\t%s" % (category, json.dumps(itemset, separators=(",", ":")), count))

    for raw_line in sys.stdin:
        try:
            key, value = raw_line.rstrip("\n").split("\t", 1)
            count = int(value)
        except (ValueError, TypeError):
            print("Skipping malformed mapper output: %s" % raw_line.rstrip(), file=sys.stderr)
            continue
        if key != current_key:
            emit(current_key, current_count)
            current_key, current_count = key, 0
        current_count += count
    emit(current_key, current_count)


if __name__ == "__main__":
    main()
