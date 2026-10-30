import json
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

# Reset all settings
try:
    # Load the JSON settings file
    with (BASE_DIR / "apriori_settings.json").open(encoding="utf-8") as j:
        configs = json.load(j)
    # Reset the pass attribute to 1
    configs["itemset-length"] = 1
    # Save the updated settings
    (BASE_DIR / "apriori_settings.json").write_text(json.dumps(configs, indent=4), encoding="utf-8")
    (BASE_DIR / "discarded_items.json").write_text("[]", encoding="utf-8")
except:
    # Print error message
    print("Couldn't reset the program.")
