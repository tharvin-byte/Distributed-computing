import time
import unittest
import sys
from pathlib import Path
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.main import app


class ApiEndpointsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_health_check(self):
        response = self.client.get("/api/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json(), {"status": "ok"})

    def test_dataset_items_endpoints(self):
        # 1. Add item
        add_res = self.client.post("/api/dataset/items", json={"item": "dragonfruit"})
        self.assertEqual(add_res.status_code, 200)
        self.assertIn("dragonfruit", add_res.json())

        # 2. List items
        list_res = self.client.get("/api/dataset/items")
        self.assertEqual(list_res.status_code, 200)
        self.assertIn("dragonfruit", list_res.json())

        # 3. Delete item
        del_res = self.client.delete("/api/dataset/items/dragonfruit")
        self.assertEqual(del_res.status_code, 200)
        self.assertNotIn("dragonfruit", del_res.json())

    def test_dataset_info_and_list(self):
        list_res = self.client.get("/api/dataset/list")
        self.assertEqual(list_res.status_code, 200)
        datasets = list_res.json()
        self.assertTrue(len(datasets) > 0)

        info_res = self.client.get("/api/dataset/info?name=csv_dataset_sample.csv")
        self.assertEqual(info_res.status_code, 200)
        info = info_res.json()
        self.assertEqual(info["dataset_name"], "csv_dataset_sample.csv")
        self.assertEqual(info["total_transactions"], 1000)

    def test_full_mining_lifecycle(self):
        # Trigger mining on sample CSV
        run_res = self.client.post("/api/mining/run", json={
            "dataset_name": "csv_dataset_sample.csv",
            "min_support": 180,
            "min_confidence": 0.40,
            "max_itemset_length": 5
        })
        self.assertEqual(run_res.status_code, 200)
        job_data = run_res.json()
        job_id = job_data["job_id"]
        self.assertIsNotNone(job_id)

        # Poll status until completed (timeout 15s)
        completed = False
        final_status = None
        for _ in range(30):
            time.sleep(0.5)
            status_res = self.client.get(f"/api/mining/status/{job_id}")
            self.assertEqual(status_res.status_code, 200)
            final_status = status_res.json()
            if final_status["status"] == "completed":
                completed = True
                break
            elif final_status["status"] == "failed":
                self.fail(f"Mining job failed: {final_status.get('error')}")

        self.assertTrue(completed, "Mining job did not complete in time")
        self.assertGreater(len(final_status["pass_metrics"]), 0)
        self.assertGreater(len(final_status["frequent_itemsets"]), 0)
        self.assertGreater(len(final_status["rules"]), 0)

        # Check rules endpoint
        rules_res = self.client.get(f"/api/mining/rules/{job_id}")
        self.assertEqual(rules_res.status_code, 200)
        self.assertEqual(len(rules_res.json()), len(final_status["rules"]))

    def test_hadoop_info_endpoint(self):
        res = self.client.get("/api/hadoop/info")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("architecture", data)
        self.assertIn("scripts", data)
        self.assertIn("mapper", data["scripts"])
        self.assertIn("reducer", data["scripts"])
        self.assertIn("driver", data["scripts"])
        self.assertTrue(len(data["scripts"]["mapper"]["code"]) > 0)



if __name__ == "__main__":
    unittest.main()
