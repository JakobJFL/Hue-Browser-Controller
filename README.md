<h1 align="center" >The Hue Browser Controller</h1>

## Introduction

The Hue Browser Controller is a website that enables you to control your Philips Hue lighting directly from the browser. It requires no software installation and works on any network.
All you have to do is sign in with your Philips Hue account.
It runs on GitHub Pages with a stateless Cloudflare Worker and uses the official Philips Hue Cloud OAuth 2.0 + CLIP v2 API over HTTPS (`api.meethue.com`).

**[Check out the Hue Browser Controller](https://jakobjfl.github.io/Hue-Browser-Controller/)**

---

## Geting started

When you enter the websigt you can sign in with your Philips Hue account the same account as you use for the phone app. You can also try out the demo to see how it works.

![The homepage.](https://raw.githubusercontent.com/JakobJFL/Hue-Browser-Controller/public/img/homepage.jpg)

After logging in, you can switch between your rooms and sounds and control the lights in them. You can also see the scenes you created in the phone app and activate them.
Your login credentials are saved in your browser, so it will remember you and automatically log you in.

![The main app where you can control your lights.](https://raw.githubusercontent.com/JakobJFL/Hue-Browser-Controller/public/img/control-app.jpg)

# Development guide

## Quick Local Development

```bash
npm install
npm run dev

# Type-check, lint & run unit tests
npm run typecheck
npm run lint
npm test
```

Open `http://localhost:5173` and click **Try Demo Mode** to test all controls immediately, or configure `.env` (see below) to test live Philips Hue OAuth login.

---

## 5-Minute Live Setup (Philips Hue + Cloudflare Worker + GitHub Pages)

### 1. Create a Free Philips Hue Remote API App
1. Sign in at [https://developers.meethue.com/my-apps/](https://developers.meethue.com/my-apps/) and click **Add new App**.
2. Fill in:
   - **App name**: `Open Hue Controller dev`
   - **Callback URL**: For local testing, register a dev app pointing to `http://localhost:5173/`. For production use, `https://jakobjfl.github.io/Hue-Browser-Controller`.
3. Copy your **AppId**, **ClientId**, and **ClientSecret**.

### 2. Deploy the Stateless Cloudflare Worker (`worker/`)
The Worker (`worker/src/index.ts`) holds `HUE_CLIENT_SECRET` privately, exchanges/refreshes OAuth tokens, triggers virtual link-button pairing, and adds CORS headers for your frontend.

```bash
cd worker

# Log in to your free Cloudflare account (no credit card required)
npx wrangler login

# Edit worker/wrangler.toml if your GitHub Pages URL differs from https://jakobjfl.github.io
# Deploy the Worker
npx wrangler deploy

# Store your Hue credentials as encrypted Worker secrets
npx wrangler secret put HUE_CLIENT_ID
npx wrangler secret put HUE_CLIENT_SECRET
```

Copy the deployed Worker URL printed by Wrangler (e.g. `https://open-hue-controller-proxy.<your-subdomain>.workers.dev`).

### 3. Configure Frontend Environment Variables

**For Local Development (`.env`):**
Copy `.env.example` to `.env` and fill in your public values:
```ini
VITE_HUE_CLIENT_ID=your_hue_client_id
VITE_HUE_APP_ID=your_hue_app_id
VITE_WORKER_URL=https://open-hue-controller-proxy.<your-subdomain>.workers.dev
```

**For GitHub Pages (`.github/workflows/deploy.yml`):**
1. In your GitHub repository, go to **Settings → Pages** and set **Build and deployment → Source** to **GitHub Actions**.
2. Go to **Settings → Secrets and variables → Actions → Variables** tab and add three **Repository variables**:
   - `VITE_HUE_CLIENT_ID`
   - `VITE_HUE_APP_ID`
   - `VITE_WORKER_URL`
3. Push to `deploy` (or `main`) — GitHub Actions will automatically build and publish `./dist` to GitHub Pages.

---

## Security Notes

- **Confidential OAuth Secret Isolation**: `HUE_CLIENT_SECRET` never touches the browser or repository; it lives only as an encrypted Cloudflare Worker secret, and the Worker enforces strict `Origin` allowlisting (`ALLOWED_ORIGINS`), payload size limits, Content-Type validation, and CLIP v2 path allowlisting.
- **Custom Domain Recommendation on GitHub Pages**: Browser `localStorage` and `Origin` headers are scoped to the domain (`https://<username>.github.io`), meaning all project sites under the same GitHub account share browser storage. If you publish multiple repositories to GitHub Pages on the same account, consider configuring a custom domain (or Cloudflare Pages/Workers) for dedicated origin isolation.

---

## License
Distributed under the MIT License. See `LICENSE` for details.

