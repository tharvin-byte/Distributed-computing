import argparse
import json
from pathlib import Path

ITEMS_FILE = Path(__file__).resolve().parent / "items" / "item_list.json"


def initialize_json():
    """ Create the item list file if it doesn't exist. """

    try:
        with ITEMS_FILE.open(encoding="utf-8") as itemjson:
            items = json.load(itemjson)
    except:
        # Create the item list
        ITEMS_FILE.parent.mkdir(parents=True, exist_ok=True)
        ITEMS_FILE.write_text("[]", encoding="utf-8")


def list_items():
    """ Display the list of items in the item list. """

    try:
        # Load the item list from the item list file
        with ITEMS_FILE.open(encoding="utf-8") as itemjson:
            items = json.load(itemjson)
            # Print each item from the list
            for i in items:
                print(i)
    except:
        print("The list was not created. ")


def add_items():
    """ Add an item to the item list. """

    # Load the item list from the item list file
    with ITEMS_FILE.open(encoding="utf-8") as itemjson:
        data = json.load(itemjson)
        # Prompt the user to add an item (Returns a string)
        new_item = input("Which item do you want to insert?")
        # Add the item to the item list
        data.append(new_item)
        # Save the new list to the item list file
        ITEMS_FILE.write_text(json.dumps(data, indent=4), encoding="utf-8")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("item", nargs="?", help="Add an item non-interactively")
    args = parser.parse_args()
    initialize_json()
    if args.item:
        data = json.loads(ITEMS_FILE.read_text(encoding="utf-8"))
        if args.item not in data:
            data.append(args.item)
        ITEMS_FILE.write_text(json.dumps(data, indent=4), encoding="utf-8")
    else:
        list_items()
        add_items()
        print("New itemset: ")
        list_items()
