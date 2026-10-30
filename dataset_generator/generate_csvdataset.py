import json
import csv
from pathlib import Path

# Convert a JSON file to CSV file
# This module is licensed under Public Domain.


def generate_csvdataset():
    """ Convert a JSON dataset to CSV dataset """

    base_dir = Path(__file__).resolve().parent
    with (base_dir / "dataset" / "dataset.json").open(encoding="utf-8") as itemjson:
        items = json.load(itemjson)
        with (base_dir / "dataset" / "csv_dataset.csv").open("w", newline="", encoding="utf-8") as csvfile:
            csv.writer(csvfile).writerows(items)

if __name__ == "__main__":
    generate_csvdataset()
