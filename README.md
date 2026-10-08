# FixMyDelhi

A mobile-friendly civic issue reporter for Delhi, powered by a Teachable Machine image classifier.

# FixMyDelhi
**Live demo:** https://fixmydelhi.vercel.app

## Setup

```bash
npm install
npm run dev
```

If you see peer-dependency errors with TF packages, run:
```bash
npm install --legacy-peer-deps
```

> TF.js and Teachable Machine are loaded via CDN script tags in `index.html` — **no** npm TF packages are needed.

## Configuration

Edit [`src/config.js`](src/config.js):

| Key | Purpose |
|---|---|
| `MODEL_URL` | Your Teachable Machine model URL |
| `TEST_EMAIL` | Complaints are opened in your mail client to this address |
| `WEBHOOK_URL` | Optional POST endpoint for JSON complaint data |

Departments are also in `config.js` — replace placeholder emails with real Delhi govt contacts.

## Pages

| Route | Description |
|---|---|
| `/` | Upload / camera → classify → file complaint |
| `/reports` | View saved reports, update status |
| `/map` | OpenStreetMap with colour-coded markers |

## Privacy

- Photos are **never stored or uploaded**.
- All report data lives in **localStorage** on your device.
- Complaints go to `TEST_EMAIL` only (a mailto link + optional webhook).
