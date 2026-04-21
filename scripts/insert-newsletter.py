#!/usr/bin/env python3
"""One-shot script: insert Newsletter iframe into Brand column of every footer
that uses the standard `foot-brand` pattern. EN files get the EN form,
AR files (under /ar/) get the AR form. Also injects the form_embed.js
script if not already present.

Safe to re-run — idempotent (skips files that already have the embed).
"""
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EN_FORM_ID = "nFTDR6jh3ZTEHJ9MMd1B"
AR_FORM_ID = "kLCZUBZR0XA53qJUetZu"
EMBED_SCRIPT = '<script src="https://media.smorchestra.com/js/form_embed.js"></script>'

EN_NEWSLETTER_HTML = f'''      <div class="foot-newsletter">
        <div class="foot-newsletter-label">Monthly build log · no spam</div>
        <div class="foot-newsletter-embed">
          <iframe
              src="https://media.smorchestra.com/widget/form/{EN_FORM_ID}"
              id="inline-{EN_FORM_ID}"
              data-layout="{{'id':'INLINE'}}"
              data-form-name="Newsletter"
              data-form-id="{EN_FORM_ID}"
              title="Newsletter"
              loading="lazy"></iframe>
        </div>
      </div>
'''

AR_NEWSLETTER_HTML = f'''      <div class="foot-newsletter">
        <div class="foot-newsletter-label">النشرة الشهرية · بدون سبام</div>
        <div class="foot-newsletter-embed">
          <iframe
              src="https://media.smorchestra.com/widget/form/{AR_FORM_ID}"
              id="inline-{AR_FORM_ID}"
              data-layout="{{'id':'INLINE'}}"
              data-form-name="Newsletter - ar"
              data-form-id="{AR_FORM_ID}"
              title="Newsletter - ar"
              loading="lazy"></iframe>
        </div>
      </div>
'''

# Pattern A: about.html / book.html / index.html / solutions/* style —
#   <div class="foot-brand">...</div><p>description</p>
#   Newsletter inserts AFTER </p>.
BRAND_BLOCK_A_RE = re.compile(
    r'(<div class="foot-brand">[^<]*<img[^>]*>[^<]*</div>\s*<p[^>]*>.*?</p>)',
    re.DOTALL
)

# Pattern B: layers/* v2 footer — foot-brand is a CONTAINER wrapping
#   <a class="brand">...</a><p>description</p><div class="loc">...</div></div>
#   Newsletter inserts AFTER the </div class="loc">, still inside foot-brand.
BRAND_BLOCK_B_RE = re.compile(
    r'(<div class="foot-brand">\s*<a[^>]*class="brand"[^>]*>.*?</a>\s*<p[^>]*>.*?</p>\s*<div class="loc">[^<]*</div>)',
    re.DOTALL
)

SENTINEL_MARKER = 'class="foot-newsletter"'


def process_file(path: str) -> str:
    with open(path, 'r', encoding='utf-8') as fh:
        content = fh.read()

    # Idempotent: skip if already inserted
    if SENTINEL_MARKER in content:
        return "SKIP (already has newsletter)"

    # Skip if no foot-brand pattern
    if 'class="foot-brand"' not in content:
        return "SKIP (no foot-brand)"

    # Determine language by path
    is_ar = '/ar/' in path.replace('\\', '/')
    newsletter = AR_NEWSLETTER_HTML if is_ar else EN_NEWSLETTER_HTML

    # Try Pattern A first (simpler footer — foot-brand is one-line header + separate <p>)
    match = BRAND_BLOCK_A_RE.search(content)
    pattern = 'A'
    if not match:
        # Fall back to Pattern B (layers v2 — foot-brand wraps brand + <p> + <div class="loc">)
        match = BRAND_BLOCK_B_RE.search(content)
        pattern = 'B'
    if not match:
        return "WARN (pattern not found)"

    new_content = content[:match.end()] + '\n' + newsletter + content[match.end():]

    # Inject form_embed.js before </body> if not already present
    if 'media.smorchestra.com/js/form_embed.js' not in new_content:
        new_content = new_content.replace(
            '</body>',
            f'{EMBED_SCRIPT}\n</body>',
            1
        )

    with open(path, 'w', encoding='utf-8', newline='') as fh:
        fh.write(new_content)

    return "OK"


def main():
    targets = []
    for root, dirs, files in os.walk(REPO_ROOT):
        # Skip archive, node_modules, .netlify
        parts = root.replace('\\', '/').split('/')
        if any(p in parts for p in ('_archive', 'node_modules', '.netlify', '.git')):
            continue
        for f in files:
            if f.endswith('.html'):
                full = os.path.join(root, f)
                targets.append(full)

    targets.sort()
    for t in targets:
        result = process_file(t)
        rel = os.path.relpath(t, REPO_ROOT)
        print(f"{result}: {rel}")


if __name__ == '__main__':
    main()
