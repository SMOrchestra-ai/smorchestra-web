#!/usr/bin/env python3
"""Insert Microsoft Clarity tracking snippet into every HTML page on the site.

Inserts right before </head> so Clarity captures the full page lifecycle.
Idempotent — skips files that already contain the snippet.

Scope: every .html under the repo root, except _archive, node_modules, .netlify,
.git, and the microsaas-readiness redirect shims (meta-refresh pages that never
actually render).
"""
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

CLARITY_PROJECT_ID = "wf3qp65p57"

SNIPPET = f"""<script type="text/javascript">
    (function(c,l,a,r,i,t,y){{
        c[a]=c[a]||function(){{(c[a].q=c[a].q||[]).push(arguments)}};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
    }})(window, document, "clarity", "script", "{CLARITY_PROJECT_ID}");
</script>
"""

SENTINEL_MARKER = f'"clarity", "script", "{CLARITY_PROJECT_ID}"'


def process_file(path: str) -> str:
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()

    if SENTINEL_MARKER in content:
        return "SKIP (already has Clarity)"

    if '</head>' not in content:
        return "WARN (no </head>)"

    # Insert snippet before </head>, preserving indentation pattern
    new_content = content.replace('</head>', SNIPPET + '</head>', 1)

    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(new_content)

    return "OK"


def main():
    updated = 0
    skipped = 0
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
            else:
                skipped += 1
    print(f'\nTotal: {updated} updated, {skipped} skipped')


if __name__ == '__main__':
    main()
