import argparse
import json
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent


def rowcount():
    """ Returns the number of rows of the required dataset (type: integer) """

    try:
        # Prompt user for number of itemsets
        # Each itemset contains one or more items.
        rows = int(input("Number of itemsets (1 or more): "))
        # There should be at least one row.
        if rows < 1:
            # Condition violated: user should try again
            return rowcount()
    except:
        # Invalid input: user should try again
        rows = rowcount()
    return rows


def generate_dataset():
    """ Create a JSON dataset out of the JSON item list file """

    # Get the number of itemsets.
    rows = rowcount()
    try:
        # Get the item list from the item list file
        with (BASE_DIR / "items" / "item_list.json").open(encoding="utf-8") as itemjson:
            items = json.load(itemjson)
        # Get the total number of items in the item list.
        itemcount = len(items)
        # Create an array which will hold the dataset
        data = []
        # Each row of the dataset: Each sub-array
        for i in range(0, rows):
            # Add some random items to each sub-array from the list of items
            count = random.randint(1, itemcount)
            data_item = []
            for j in range(0, count):
                item_added = random.choice(items)
                data_item.append(item_added)
            data.append(data_item)
        # Save the dataset into the JSON file.
        output = BASE_DIR / "dataset" / "dataset.json"
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(data, indent=4), encoding="utf-8")
    except:
        print("Item list was not found")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("rows", nargs="?", type=int, help="Number of transactions")
    args = parser.parse_args()
    if args.rows is not None:
        rowcount = lambda: args.rows
    generate_dataset()
