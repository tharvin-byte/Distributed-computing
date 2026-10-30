import json
import subprocess
import sys
from pathlib import Path
import unittest


ROOT = Path(__file__).parents[1]
SRC = ROOT / "src"


class HadoopStreamingTests(unittest.TestCase):
    def run_script(self, script, arguments, input_text):
        return subprocess.run([sys.executable, str(SRC / script), *arguments], input=input_text,
                              text=True, capture_output=True, check=True).stdout.splitlines()

    def test_mapper_deduplicates_and_prunes(self):
        discarded = self._write_state([["bread", "milk"]])
        try:
            output = self.run_script("mapper.py", ["--itemset-length", "2", "--discarded-file", str(discarded)],
                                    "bread,milk,eggs\nbread,eggs\n")
            self.assertEqual(output, ['["bread","eggs"]\t1', '["eggs","milk"]\t1', '["bread","eggs"]\t1'])
        finally:
            discarded.unlink(missing_ok=True)

    def test_reducer_counts_grouped_keys(self):
        output = self.run_script("reducer.py", ["--minimum-support", "2"],
                                '["bread","eggs"]\t1\n["bread","eggs"]\t1\n["milk","eggs"]\t1\n')
        self.assertEqual(output, ['frequent\t["bread","eggs"]\t2', 'discarded\t["milk","eggs"]\t1'])

    @staticmethod
    def _write_state(value):
        path = ROOT / ".test-discarded-items.json"
        path.write_text(json.dumps(value), encoding="utf-8")
        return path


if __name__ == "__main__":
    unittest.main()
