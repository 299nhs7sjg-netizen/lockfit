# LockFit

**Preview any wallpaper on real iPhone / Android lock screens** so Dynamic Island, clocks, and punch-holes don’t cut faces. Export a safe-crop PNG.

**Price:** $0.99 lifetime (license key)

Live: https://299nhs7sjg-netizen.github.io/lockfit/

## Features (MVP)

1. Upload wallpaper (PNG / JPG / WebP)
2. Device presets with overlays: Dynamic Island, notch, Android punch-hole, clock/widget safe zones
3. Pan & zoom under overlays
4. Export wallpaper-only safe crop, or with UI overlay
5. Free tier: 2 device presets + watermark on export  
   Unlock ($0.99): all devices + no watermark
6. Unlock modal: checkout URL from `config.js` + **license key entry only**
7. Ad placeholders (`data-ad`) on free; hidden when unlocked

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell |
| `app.js` | Preview, export, license |
| `styles.css` | Dark UI |
| `config.js` | `checkoutUrl`, `VALID_KEYS` (public seed keys) |
| `favicon.svg` | Icon |
| `PAYMENTS.md` | How to sell keys |
| `KEYS.PRIVATE.md` | Full key list — **gitignored, never commit** |

## Local use

Open `index.html` in a browser, or serve:

```bash
npx serve .
# or: python3 -m http.server 8080
```

## Unlock

1. Customer pays via checkout URL in `config.js` (see PAYMENTS.md)
2. You send a key from `KEYS.PRIVATE.md` (format `IB-LOCK-XXXX-XXXX`)
3. Customer enters the key in the Unlock modal — no honor-system toggle

Seed keys in `config.js` → `VALID_KEYS` are for testing / early sales. Keep unused keys only in `KEYS.PRIVATE.md`.

## Deploy (GitHub Pages)

```bash
git init
git add index.html app.js styles.css favicon.svg config.js README.md PAYMENTS.md .gitignore
git commit -m "LockFit MVP"
# push to 299nhs7sjg-netizen/lockfit
# Settings → Pages → Deploy from branch main / root
```

## License

Proprietary — Wes Green. All rights reserved.
