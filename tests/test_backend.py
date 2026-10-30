import unittest
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.services.dataset_service import get_items, add_item, remove_item, generate_dataset, get_dataset_info
from app.services.rules_engine import generate_association_rules
from app.services.apriori_runner import _execute_pass


class BackendServicesTests(unittest.TestCase):
    def test_item_management(self):
        test_item = "__test_item_mock__"
        add_item(test_item)
        items = get_items()
        self.assertIn(test_item, items)

        remove_item(test_item)
        items_after = get_items()
        self.assertNotIn(test_item, items_after)

    def test_dataset_generation(self):
        info = generate_dataset(20)
        self.assertEqual(info.total_transactions, 20)
        self.assertGreater(info.unique_items_count, 0)
        self.assertTrue(len(info.sample_transactions) > 0)

    def test_rules_engine_math(self):
        # 20 transactions
        frequent_dict = {
            ("bread",): 10,
            ("butter",): 10,
            ("milk",): 10,
            ("bread", "butter"): 8,
            ("bread", "milk"): 6,
            ("butter", "milk"): 5,
            ("bread", "butter", "milk"): 4
        }
        rules = generate_association_rules(frequent_dict, total_transactions=20, min_confidence=0.5)
        self.assertTrue(len(rules) > 0)

        # Check a specific rule: ('bread',) => ('butter',)
        # supp(bread, butter) = 8, supp(bread) = 10, supp(butter) = 10
        # confidence = 8 / 10 = 0.8
        # lift = (8 * 20) / (10 * 10) = 1.6
        rule = next(
            (r for r in rules if r.antecedent == ["bread"] and r.consequent == ["butter"]),
            None
        )
        self.assertIsNotNone(rule)
        self.assertEqual(rule.support_count, 8)
        self.assertEqual(rule.confidence, 0.8)
        self.assertEqual(rule.lift, 1.6)

    def test_execute_pass_local(self):
        import tempfile
        with tempfile.TemporaryDirectory() as tmp_dir:
            disc_path = Path(tmp_dir) / "discarded.json"
            disc_path.write_text("[]", encoding="utf-8")
            input_text = "bread,butter,milk\nbread,milk\nbutter,milk\n"

            freq, disc, duration = _execute_pass(
                pass_number=1,
                input_text=input_text,
                input_format="csv",
                min_support=2,
                discarded_path=disc_path
            )
            # Bread=2, Milk=3, Butter=2 -> all frequent
            frequent_names = [f[0][0] for f in freq]
            self.assertIn("bread", frequent_names)
            self.assertIn("milk", frequent_names)
            self.assertIn("butter", frequent_names)
            self.assertGreater(duration, 0)


if __name__ == "__main__":
    unittest.main()

