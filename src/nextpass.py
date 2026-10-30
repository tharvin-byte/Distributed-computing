import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
SETTINGS_FILE = BASE_DIR / "apriori_settings.json"
DISCARDED_FILE = BASE_DIR / "discarded_items.json"


def nextPass():
    """ Indicate next pass

    Add 1 to the pass attribute in the JSON file
    This module can run without Hadoop.
    """

    try:
        # Load the JSON settings file
        with SETTINGS_FILE.open(encoding="utf-8") as j:
            configs = json.load(j)
        # Increment the pass attribute by 1
        configs["itemset-length"] += 1
        # Save the updated settings
        SETTINGS_FILE.write_text(json.dumps(configs, indent=4), encoding="utf-8")
    except:
        # Print error message
        print("Couldn't go to next pass")


def updateDiscarded():
    """ Update the list of discarded items from most recent pass """

    try:
        old_discarded = json.loads(DISCARDED_FILE.read_text(encoding="utf-8")) if DISCARDED_FILE.exists() else []
        for output_file in BASE_DIR.glob("part-*"):
            for line in output_file.read_text(encoding="utf-8").splitlines():
                fields = line.split("\t")
                if len(fields) == 3 and fields[0] == "discarded":
                    itemset = json.loads(fields[1])
                    if itemset not in old_discarded:
                        old_discarded.append(itemset)
        DISCARDED_FILE.write_text(json.dumps(old_discarded, indent=2), encoding="utf-8")
    except:
        # Print error message
        print("Couldn't update list of discarded items. Try manually.")

nextPass()
updateDiscarded()
