# eek

## Development

### Cache-busting workflow (site.version)
- When you change any JS or CSS that is referenced in HTML, bump the global version in `_config.yml`:
  - `version: YYYYMMDD` (or a timestamp)
- All asset tags using `?v={{ site.version }}` will update automatically and force browsers/CDNs to fetch the latest files.
- Typical steps:
  1) Edit JS/CSS
  2) Update `_config.yml` → `version`
  3) Commit and push

Notes:
- This is a site-wide bust. If you prefer per-file hashes later, we can switch to that pattern.
