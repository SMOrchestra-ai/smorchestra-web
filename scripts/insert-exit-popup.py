#!/usr/bin/env python3
"""Insert the custom exit-intent popup script (/assets/exit-popup.js) into
every HTML page on the site, except the 4 scorecard/report pages where a
popup would hurt the funnel.

GHL doesn't ship a usable exit-intent popup for external sites (verified
with Lana 2026-04-21 — the "Sites > Popups" path in the integration guide
doesn't exist in the GHL UI; popups only live inside GHL-hosted funnels).
So this is a local implementation — see assets/exit-popup.js + the
#smo-exit-popup block in assets/site.css.

Mirrors scripts/insert-clarity.py pattern: idempotent via sentinel, OK/SKIP/
WARN per file, walks the tree, respects the standard skip list.
"""
import os

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SNIPPET = '<script src="/assets/exit-popup.js" defer></script>'
SENTINEL_MARKER = '/assets/exit-popup.js'

# Scorecard + report pages are excluded. Paths are relative to REPO_ROOT,
# forward-slash form. Popup on a quiz page = interrupting a 20-question
# flow mid-answer. Popup on a report page = funnel loop (they got here
# FROM the scorecard).
EXCLUDED_PAGES = {
    "tools/ai-native-readiness/index.html",
    "ar/tools/ai-native-readiness/index.html",
    "reports/ai-native-readiness-framework.html",
    "ar/reports/ai-native-readiness-framework.html",
}


def is_excluded(abs_path: str) -> bool:
    rel = os.path.relpath(abs_path, REPO_ROOT).replace('\\', '/')
    return rel in EXCLUDED_PAGES


def process_file(path: str) -> str:
    if is_excluded(path):
        return "SKIP (excluded: scorecard/report page)"

    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()

    if SENTINEL_MARKER in content:
        return "SKIP (already has popup)"

    if '</body>' not in content:
        return "WARN (no </body>)"

    # Insert on its own line immediately before </body>. Lands right next
    # to the existing chat-widget + plausible + nav.js block, which is
    # already clustered before </body> on all pages.
    new_content = content.replace('</body>', SNIPPET + '\n</body>', 1)

    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(new_content)

    return "OK"


def main():
    updated = 0
    skipped = 0
    warned = 0
    for root, _dirs, files in os.walk(REPO_ROOT):
        parts = root.replace('\\', '/').split('/')
        if any(p in parts for p in ('_archive', 'node_modules', '.netlify', '.git', 'scripts', 'microsaas-readiness')):
            continue
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            result = process_file(path)
            rel = os.path.relpath(path, REPO_ROOT)
            print(f'{result}: {rel}')
            if result == "OK":
                updated += 1
            elif result.startswith("WARN"):
                warned += 1
            else:
                skipped += 1
    print(f'\nTotal: {updated} updated, {skipped} skipped, {warned} warnings')


if __name__ == '__main__':
    main()
