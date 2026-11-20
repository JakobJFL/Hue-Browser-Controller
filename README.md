# Open Hue Controller

A modern, minimalist browser controller for **Philips Hue** built with **Vue 3**, **TypeScript**, **Tailwind CSS**, and **Lucide Icons**, running 100% free (no credit card required) on **GitHub Pages** + a stateless **Cloudflare Worker**.

- **Zero Mixed-Content Warnings**: Uses the official Philips Hue Cloud OAuth 2.0 + CLIP v2 API over HTTPS (`api.meethue.com`) instead of local `http://` V1 requests.
- **No Bridge IP or Physical Button Press**: Automatically pairs via virtual link-button on sign-in.
- **Request-Optimized**: Single-request state hydration (`GET /clip/v2/resource`), instant optimistic UI updates, and debounced sliders (~20 requests/user/day).
- **Instant Demo Mode**: Test and iterate on UI/UX locally with realistic mock rooms, zones, scenes, and lights before connecting credentials.

---

## Quick Local Development

```bash
npm install
npm run dev

# Type-check & lint
npm run typecheck
npm run lint
```

Open `http://localhost:5173` and click **Try Demo Mode** to test all controls immediately, or configure `.env` (see below) to test live Philips Hue OAuth login.

---

## 5-Minute Live Setup (Philips Hue + Cloudflare Worker + GitHub Pages)

### 1. Create a Free Philips Hue Remote API App
1. Sign in at [https://developers.meethue.com/my-apps/](https://developers.meethue.com/my-apps/) and click **Add new App**.
2. Fill in:
   - **App name**: `Open Hue Controller`
   - **Callback URL**: `https://jakobjfl.github.io/Hue-Browser-Controller/` *(for local testing, you can also register a dev app pointing to `http://localhost:5173/`)*
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

## License
Distributed under the MIT License. See `LICENSE` for details.

