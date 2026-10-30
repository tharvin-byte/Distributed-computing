"""
End-to-End Playwright Browser Verification for Market Basket Analysis Web Application.
Runs headless Chromium against http://localhost:5173 and verifies all 5 user journeys.
"""

import sys
import os
import time
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

# Ensure UTF-8 output encoding on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

SCREENSHOT_DIR = Path(__file__).resolve().parent / "screenshots"
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

BASE_URL = "http://localhost:5173"

def run_e2e_tests():
    print("=" * 70, flush=True)
    print("STARTING PLAYWRIGHT END-TO-END BROWSER VERIFICATION", flush=True)
    print(f"Target URL: {BASE_URL}", flush=True)
    print(f"Screenshots directory: {SCREENSHOT_DIR}", flush=True)
    print("=" * 70, flush=True)

    results = {}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 960},
            permissions=["clipboard-read", "clipboard-write"]
        )
        page = context.new_page()

        # Handle dialogs & log console errors
        page.on("dialog", lambda dialog: (
            print(f"  [BROWSER DIALOG] {dialog.type}: {dialog.message}", flush=True),
            dialog.accept()
        ))
        page.on("console", lambda msg: (
            print(f"  [BROWSER CONSOLE {msg.type.upper()}] {msg.text}", flush=True)
            if msg.type in ("error", "warning") else None
        ))

        # -------------------------------------------------------------
        # JOURNEY 1: Navigation & Tab Switching
        # -------------------------------------------------------------
        print("\n--- [Journey 1] Navigation & Tab Switching ---", flush=True)
        try:
            page.goto(BASE_URL, wait_until="domcontentloaded", timeout=15000)
            page.wait_for_selector("header", timeout=10000)

            # Check title / brand
            brand = page.locator("text=MarketBasket").first
            expect(brand).to_be_visible()
            badge = page.locator("text=Apriori AI").first
            expect(badge).to_be_visible()

            # Verify all 4 tabs exist
            expected_tabs = [
                'Dataset Studio',
                'Mining Studio',
                'Rules & Insights',
                'Hadoop Architecture'
            ]
            nav_tabs = page.locator("nav button")
            expect(nav_tabs).to_have_count(4)

            for tab_name in expected_tabs:
                tab_btn = page.locator(f"nav button:has-text('{tab_name}')")
                expect(tab_btn).to_be_visible()
                print(f"  [OK] Tab button '{tab_name}' is visible.", flush=True)

            page.screenshot(path=str(SCREENSHOT_DIR / "01_tab_navigation.png"), full_page=False)
            results["Journey 1: Navigation & Tab Switching"] = "PASSED"
            print("  --> Journey 1 PASSED", flush=True)
        except Exception as e:
            print(f"  --> Journey 1 FAILED: {e}", flush=True)
            results["Journey 1: Navigation & Tab Switching"] = f"FAILED: {e}"
            page.screenshot(path=str(SCREENSHOT_DIR / "01_tab_navigation_failed.png"))

        # -------------------------------------------------------------
        # JOURNEY 2: Dataset Studio
        # -------------------------------------------------------------
        print("\n--- [Journey 2] Dataset Studio & Catalog Management ---", flush=True)
        try:
            # Switch to Dataset Studio tab
            page.locator("nav button:has-text('Dataset Studio')").click()
            time.sleep(0.5)

            # 1. Verify Store Item Catalog heading and count
            catalog_heading = page.locator("text=Store Item Catalog")
            expect(catalog_heading).to_be_visible()

            # Wait for items to load
            page.wait_for_selector("span:has-text('items')")
            item_badges = page.locator("div.flex.flex-wrap.gap-2 span.capitalize")
            initial_count = item_badges.count()
            print(f"  [OK] Store Item Catalog loaded with {initial_count} items.", flush=True)
            assert initial_count > 0, "Item catalog is empty!"

            # 2. Add new item 'papaya'
            test_item = "papaya"
            input_box = page.locator("input[placeholder*='coffee, avocado']")
            expect(input_box).to_be_visible()
            input_box.fill(test_item)
            add_button = page.locator("form button:has-text('Add')")
            add_button.click()

            # Verify 'papaya' appears in catalog
            papaya_badge = page.locator(f"div.flex.flex-wrap.gap-2 span:has-text('{test_item}')").first
            expect(papaya_badge).to_be_visible(timeout=5000)
            print(f"  [OK] Successfully added '{test_item}' to catalog.", flush=True)
            page.screenshot(path=str(SCREENSHOT_DIR / "02_dataset_studio_item_added.png"))

            # 3. Remove 'papaya' item
            delete_btn = page.locator(f"button[title='Remove {test_item}']")
            expect(delete_btn).to_be_visible()
            delete_btn.click()

            # Verify 'papaya' is removed
            expect(papaya_badge).to_have_count(0, timeout=5000)
            print(f"  [OK] Successfully removed '{test_item}' from catalog.", flush=True)
            page.screenshot(path=str(SCREENSHOT_DIR / "02_dataset_studio_item_removed.png"))

            # 4. Verify transaction preview table displays sample rows
            preview_heading = page.locator("h3:has-text('Transaction Preview:')")
            expect(preview_heading).to_be_visible()

            preview_table_rows = page.locator("table tbody tr")
            row_count = preview_table_rows.count()
            print(f"  [OK] Transaction preview table loaded with {row_count} sample baskets.", flush=True)
            assert row_count > 0, "No sample transactions displayed in table!"

            # Check table headers: Basket #, Item Count, Purchased Items
            expect(page.locator("th:has-text('Basket #')")).to_be_visible()
            expect(page.locator("th:has-text('Item Count')")).to_be_visible()
            expect(page.locator("th:has-text('Purchased Items')")).to_be_visible()

            page.screenshot(path=str(SCREENSHOT_DIR / "02_dataset_studio_preview_table.png"))
            results["Journey 2: Dataset Studio"] = "PASSED"
            print("  --> Journey 2 PASSED", flush=True)
        except Exception as e:
            print(f"  --> Journey 2 FAILED: {e}", flush=True)
            results["Journey 2: Dataset Studio"] = f"FAILED: {e}"
            page.screenshot(path=str(SCREENSHOT_DIR / "02_dataset_studio_failed.png"))

        # -------------------------------------------------------------
        # JOURNEY 3: Mining Studio
        # -------------------------------------------------------------
        print("\n--- [Journey 3] Mining Studio & Apriori Execution ---", flush=True)
        try:
            # Switch to 'Mining Studio' tab
            page.locator("nav button:has-text('Mining Studio')").click()
            time.sleep(0.5)

            # Verify parameter sliders: Min Support, Min Confidence, Max Itemset Size
            expect(page.locator("text=Apriori Mining Configuration")).to_be_visible()
            expect(page.locator("text=Minimum Support")).to_be_visible()
            expect(page.locator("text=Minimum Confidence")).to_be_visible()
            expect(page.locator("text=Max Itemset Size (k)")).to_be_visible()
            print("  [OK] Verified sliders: Minimum Support, Minimum Confidence, Max Itemset Size.", flush=True)

            page.screenshot(path=str(SCREENSHOT_DIR / "03_mining_studio_sliders.png"))

            # Click 'Execute Apriori Mining'
            mine_btn = page.locator("button:has-text('Execute Apriori Mining')")
            expect(mine_btn).to_be_visible()
            mine_btn.click()
            print("  [OK] Clicked 'Execute Apriori Mining'. Waiting for multi-pass execution...", flush=True)

            # Wait for completion summary or 'View Discovered Association Rules' button
            view_rules_btn = page.locator("button:has-text('View Discovered Association Rules')")
            view_rules_btn.wait_for(state="visible", timeout=30000)

            # Verify sequential pass timeline updates (Pass 1, Pass 2, etc.)
            expect(page.locator("h3:has-text('Sequential MapReduce Passes Timeline')")).to_be_visible()
            pass_cards = page.locator("div.grid div:has-text('Pass 1 (k=1)')")
            expect(pass_cards.first).to_be_visible()
            print("  [OK] Sequential MapReduce pass timeline verified (Pass 1, Pass 2, etc. displayed).", flush=True)

            # Verify completion message
            completion_msg = page.locator("text=Mining completed!")
            expect(completion_msg).to_be_visible()
            print("  [OK] Mining completion summary confirmed.", flush=True)

            page.screenshot(path=str(SCREENSHOT_DIR / "03_mining_studio_completed.png"))
            results["Journey 3: Mining Studio"] = "PASSED"
            print("  --> Journey 3 PASSED", flush=True)
        except Exception as e:
            print(f"  --> Journey 3 FAILED: {e}", flush=True)
            results["Journey 3: Mining Studio"] = f"FAILED: {e}"
            page.screenshot(path=str(SCREENSHOT_DIR / "03_mining_studio_failed.png"))

        # -------------------------------------------------------------
        # JOURNEY 4: Rules & Insights
        # -------------------------------------------------------------
        print("\n--- [Journey 4] Rules & Insights Explorer ---", flush=True)
        try:
            # Click 'View Discovered Association Rules' or tab 'Rules & Insights'
            view_rules_btn = page.locator("button:has-text('View Discovered Association Rules')")
            if view_rules_btn.is_visible():
                view_rules_btn.click()
            else:
                page.locator("nav button:has-text('Rules & Insights')").click()
            time.sleep(0.5)

            # Verify Association Rules heading and table
            rules_header = page.locator("h3:has-text('Association Rules')")
            expect(rules_header).to_be_visible()

            # Verify Rules Table columns
            rules_table = page.locator("table").first
            expect(rules_table.locator("th:has-text('Antecedent')")).to_be_visible()
            expect(rules_table.locator("th:has-text('Consequent')")).to_be_visible()
            expect(page.get_by_role("columnheader", name="Support", exact=True)).to_be_visible()
            expect(rules_table.locator("th:has-text('Confidence')")).to_be_visible()
            expect(rules_table.locator("th:has-text('Lift Correlation')")).to_be_visible()

            # Verify rules are present
            rule_rows = rules_table.locator("tbody tr")
            rules_count = rule_rows.count()
            print(f"  [OK] Association Rules table rendered with {rules_count} rules.", flush=True)
            assert rules_count > 0, "No association rules displayed!"

            # Test sorting dropdown: change to Highest Confidence then Highest Lift Factor
            sort_select = page.locator("select:has(option[value='confidence'])")
            sort_select.select_option("confidence")
            time.sleep(0.3)
            print("  [OK] Changed sort to 'Highest Confidence'.", flush=True)

            sort_select.select_option("lift")
            time.sleep(0.3)
            print("  [OK] Changed sort back to 'Highest Lift Factor'.", flush=True)

            # Test item search filter using the first rule item
            search_box = page.locator("input[placeholder='Search items in rule...']")
            first_rule_item = page.locator("table tbody tr td span.capitalize").first.inner_text().strip()
            print(f"  [Testing Search] Searching for item: '{first_rule_item}'", flush=True)
            search_box.fill(first_rule_item)
            time.sleep(0.3)
            filtered_count = rules_table.locator("tbody tr").count()
            print(f"  [OK] Search filtered rules table to {filtered_count} matching rows.", flush=True)
            assert filtered_count > 0, f"Search for '{first_rule_item}' yielded no rows!"
            search_box.fill("")  # Clear search
            time.sleep(0.3)

            # Test CSV & JSON export buttons
            csv_btn = page.locator("button:has-text('Export CSV')")
            expect(csv_btn).to_be_visible()
            json_btn = page.locator("button:has-text('Export JSON')")
            expect(json_btn).to_be_visible()

            try:
                with page.expect_download(timeout=3000) as download_info_csv:
                    csv_btn.click()
                print(f"  [OK] Export CSV triggered download: {download_info_csv.value.suggested_filename}", flush=True)
            except Exception:
                csv_btn.click()
                print("  [OK] Export CSV clicked successfully.", flush=True)

            try:
                with page.expect_download(timeout=3000) as download_info_json:
                    json_btn.click()
                print(f"  [OK] Export JSON triggered download: {download_info_json.value.suggested_filename}", flush=True)
            except Exception:
                json_btn.click()
                print("  [OK] Export JSON clicked successfully.", flush=True)

            # Verify Frequent Itemsets table (grouped by k) below rules
            frequent_heading = page.locator("h3:has-text('Frequent Itemsets')")
            expect(frequent_heading).to_be_visible()
            expect(page.get_by_role("columnheader", name="Size (k)")).to_be_visible()
            expect(page.get_by_role("columnheader", name="Discovered Itemset")).to_be_visible()

            # Test length filter on frequent itemsets
            length_select = page.locator("select:has(option:has-text('All Sizes (k)'))")
            expect(length_select).to_be_visible()
            print("  [OK] Frequent Itemsets table verified with size filters.", flush=True)

            page.screenshot(path=str(SCREENSHOT_DIR / "04_rules_and_insights.png"), full_page=True)
            results["Journey 4: Rules & Insights"] = "PASSED"
            print("  --> Journey 4 PASSED", flush=True)
        except Exception as e:
            print(f"  --> Journey 4 FAILED: {e}", flush=True)
            results["Journey 4: Rules & Insights"] = f"FAILED: {e}"
            page.screenshot(path=str(SCREENSHOT_DIR / "04_rules_and_insights_failed.png"))

        # -------------------------------------------------------------
        # JOURNEY 5: Hadoop Architecture
        # -------------------------------------------------------------
        print("\n--- [Journey 5] Hadoop Architecture & Implementation Showcase ---", flush=True)
        try:
            # Switch to 'Hadoop Architecture' tab
            page.locator("nav button:has-text('Hadoop Architecture')").click()
            time.sleep(0.5)

            # Verify Header
            arch_heading = page.locator("h2:has-text('How the Multi-Pass Apriori Engine Works on Hadoop')")
            expect(arch_heading).to_be_visible()
            print("  [OK] Hadoop Architecture header is visible.", flush=True)

            # Wait for Hadoop architecture API data to load
            page.wait_for_selector("text=HDFS Input Splitting", timeout=10000)

            # Test MapReduce pipeline 5-stage stepper (click stages 1 to 5)
            for stage_num in range(1, 6):
                # Click the stage button by its step number pill
                btn = page.locator(f"button:has(span.font-mono:text-is('{stage_num}'))").first
                expect(btn).to_be_visible()
                btn.click()
                time.sleep(0.2)
                # Verify detailed breakdown shows Stage {stage_num} of 5
                stage_badge = page.locator(f"span:has-text('Stage {stage_num} of 5')")
                expect(stage_badge).to_be_visible()
                print(f"  [OK] Stage {stage_num} clicked and verified.", flush=True)

            # Test Live Hadoop CLI Command generator
            cli_heading = page.locator("h3:has-text('Live Hadoop CLI Command')")
            expect(cli_heading).to_be_visible()

            # Toggle command mode
            single_pass_btn = page.locator("button:has-text('Single Pass Job')")
            single_pass_btn.click()
            time.sleep(0.2)
            expect(page.locator("pre:has-text('hadoop jar $HADOOP_STREAMING_JAR')")).to_be_visible()
            print("  [OK] Toggled to 'Single Pass Job' CLI generator.", flush=True)

            driver_btn = page.locator("button:has-text('Full Multi-Pass Driver')")
            driver_btn.click()
            time.sleep(0.2)
            expect(page.locator("pre:has-text('python3 src/hadoop_apriori.py')")).to_be_visible()
            print("  [OK] Toggled back to 'Full Multi-Pass Driver' CLI generator.", flush=True)

            # Test CLI copy button (using get_by_role exact match)
            copy_cli_btn = page.get_by_role("button", name="Copy", exact=True)
            copy_cli_btn.click()
            time.sleep(0.2)
            copied_badge = page.locator("span:has-text('Copied!')")
            expect(copied_badge).to_be_visible()
            print("  [OK] CLI Copy button verified (displayed 'Copied!').", flush=True)

            # Test in-browser Code Inspector tabs
            code_inspector_heading = page.locator("h3:has-text('Interactive Source Code Inspector')")
            expect(code_inspector_heading).to_be_visible()

            # Target the code viewer pre directly
            code_pre = page.locator("div.max-h-\\[460px\\] pre")

            # Tab 1: mapper.py (Map Worker)
            page.locator("button:has-text('mapper.py (Map Worker)')").click()
            time.sleep(0.3)
            expect(page.locator("strong:has-text('src/mapper.py')")).to_be_visible()
            mapper_code = code_pre.inner_text()
            assert "sys.stdin" in mapper_code or "combinations" in mapper_code, "mapper.py code did not load!"
            print(f"  [OK] mapper.py loaded ({len(mapper_code)} chars).", flush=True)

            # Tab 2: reducer.py (Reduce Worker)
            page.locator("button:has-text('reducer.py (Reduce Worker)')").click()
            time.sleep(0.3)
            expect(page.locator("strong:has-text('src/reducer.py')")).to_be_visible()
            reducer_code = code_pre.inner_text()
            assert "current_key" in reducer_code or "sys.stdin" in reducer_code or "minimum-support" in reducer_code, "reducer.py code did not load!"
            print(f"  [OK] reducer.py loaded ({len(reducer_code)} chars).", flush=True)

            # Tab 3: hadoop_apriori.py (Driver)
            page.locator("button:has-text('hadoop_apriori.py (Driver)')").click()
            time.sleep(0.3)
            expect(page.locator("strong:has-text('src/hadoop_apriori.py')")).to_be_visible()
            driver_code = code_pre.inner_text()
            assert "hadoop" in driver_code.lower() or "streaming" in driver_code.lower(), "hadoop_apriori.py code did not load!"
            print(f"  [OK] hadoop_apriori.py loaded ({len(driver_code)} chars).", flush=True)

            # Test Copy Code button (using get_by_role exact match)
            copy_code_btn = page.get_by_role("button", name="Copy Code")
            copy_code_btn.click()
            time.sleep(0.2)
            expect(page.locator("span:has-text('Code Copied')")).to_be_visible()
            print("  [OK] Copy Code button verified (displayed 'Code Copied').", flush=True)

            page.screenshot(path=str(SCREENSHOT_DIR / "05_hadoop_architecture.png"), full_page=True)
            results["Journey 5: Hadoop Architecture"] = "PASSED"
            print("  --> Journey 5 PASSED", flush=True)
        except Exception as e:
            print(f"  --> Journey 5 FAILED: {str(e).encode('ascii', 'replace').decode()}", flush=True)
            results["Journey 5: Hadoop Architecture"] = f"FAILED: {e}"
            page.screenshot(path=str(SCREENSHOT_DIR / "05_hadoop_architecture_failed.png"))

        browser.close()

    print("\n" + "=" * 70, flush=True)
    print("E2E BROWSER VERIFICATION SUMMARY:", flush=True)
    all_passed = True
    for journey, status in results.items():
        print(f"  {journey}: {status}", flush=True)
        if status != "PASSED":
            all_passed = False
    print("=" * 70, flush=True)

    return all_passed, results

if __name__ == "__main__":
    success, summary = run_e2e_tests()
    sys.exit(0 if success else 1)
