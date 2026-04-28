#!/usr/bin/env python3
"""Replace every mailto:hello@smorchestra.ai and mailto:mamoun@smorchestra.ai
link with /contact (EN) or /ar/contact (AR) based on file path.

Also strips subject= query params (the form dropdown handles topic routing).

Idempotent — runs safely multiple times; skips files without mailto.
"""
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Match href="mailto:hello@smorchestra.ai" optionally followed by ?subject=...
# up to the closing quote. Captures the opening quote style.
MAILTO_RE = re.compile(
    r'href=(["\'])mailto:(hello|mamoun)@smorchestra\.ai(\?[^"\']*)?\1'
)


def process_file(path: str) -> tuple[str, int]:
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()

    is_ar = '/ar/' in path.replace('\\', '/') or '\\ar\\' in path
    target = '/ar/contact' if is_ar else '/contact'

    matches = list(MAILTO_RE.finditer(content))
    if not matches:
        return "SKIP (no mailto)", 0

    # Replace — quote style preserved via backreference to group 1
    new_content = MAILTO_RE.sub(
        lambda m: f'href={m.group(1)}{target}{m.group(1)}',
        content
    )

    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(new_content)

    return "OK", len(matches)


def main():
    total_replacements = 0
    files_updated = 0
    for root, _dirs, files in os.walk(REPO_ROOT):
        parts = root.replace('\\', '/').split('/')
        if any(p in parts for p in ('_archive', 'node_modules', '.netlify', '.git', 'scripts')):
            continue
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            result, count = process_file(path)
            rel = os.path.relpath(path, REPO_ROOT)
            if count > 0:
                print(f'{result} ({count} links): {rel}')
                total_replacements += count
                files_updated += 1
    print(f'\nTotal: {total_replacements} mailto links replaced in {files_updated} files')


if __name__ == '__main__':
    main()
