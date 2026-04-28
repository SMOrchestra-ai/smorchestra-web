#!/usr/bin/env python3
"""Remove loading="lazy" from newsletter iframes only.
Lazy-loading interferes with GHL's form_embed.js initialization —
the script injects handshake scripts on an unloaded iframe, leaving it blank.
"""
import os
import re

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

IFRAME_LAZY_RE = re.compile(
    r'(<iframe\s[^>]*data-form-id="(?:nFTDR6jh3ZTEHJ9MMd1B|kLCZUBZR0XA53qJUetZu)"[^>]*?)\s+loading="lazy"',
    re.DOTALL
)


def main():
    count = 0
    for root, _dirs, files in os.walk(REPO_ROOT):
        parts = root.replace('\\', '/').split('/')
        if any(p in parts for p in ('_archive', 'node_modules', '.netlify', '.git', 'scripts')):
            continue
        for f in files:
            if not f.endswith('.html'):
                continue
            path = os.path.join(root, f)
            with open(path, 'r', encoding='utf-8') as fh:
                content = fh.read()
            if 'class="foot-newsletter-embed"' not in content:
                continue
            new = IFRAME_LAZY_RE.sub(r'\1', content)
            if new != content:
                with open(path, 'w', encoding='utf-8', newline='') as fh:
                    fh.write(new)
                count += 1
                rel = os.path.relpath(path, REPO_ROOT)
                print(f'UPDATED: {rel}')
    print(f'\nTotal: {count} files')


if __name__ == '__main__':
    main()
