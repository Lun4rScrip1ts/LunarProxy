# Lunar Proxy — Railway setup

## Why search / sites do nothing

Your Hono app ended with only:

```ts
export default app;
```

That works on **Cloudflare Workers / Bun**, not on Railway’s Node runtime.
Railway injects `PORT` and expects your process to **listen** on it. If nothing binds to `PORT`, the deploy looks “up” but every request fails or hangs — so the home page may load from cache while `/proxy` and `/view` do nothing.

## Files you need in the repo root

| File | Purpose |
|------|---------|
| `app.ts` | Your Hono routes (the big Lunar file we fixed) |
| `server.ts` | Node entry — listens on `PORT` |
| `package.json` | deps + `start` script |

## Railway Variables (Settings → Variables)

You do **not** need custom secrets for a basic proxy. Railway already provides:

| Variable | What it is |
|----------|------------|
| `PORT` | **Required.** Railway sets this. Your server must use it. |
| `RAILWAY_PUBLIC_DOMAIN` | e.g. `lunar-production-xxxx.up.railway.app` |
| `RAILWAY_ENVIRONMENT` | `production` / etc. |

Optional (you can add these):

| Variable | Example | Notes |
|----------|---------|--------|
| `NODE_ENV` | `production` | Standard |
| `USER_AGENT` | (leave empty) | Code already sets a Chrome UA |

**Do not** set `PORT` yourself unless you know what you’re doing — Railway assigns it.

## Railway service settings

1. **Settings → Networking → Generate Domain**  
   Without a public domain, nothing is reachable from the browser.

2. **Settings → Deploy → Start Command** (if auto-detect fails):
   ```bash
   npm start
   ```
   or:
   ```bash
   npx tsx server.ts
   ```

3. **Root Directory**  
   If the app isn’t at the repo root, set Root Directory to the folder that contains `package.json`.

4. **Outbound networking**  
   Proxies need outbound HTTPS. On free/trial plans this is usually allowed. If fetches fail with network errors, check **Settings → Networking → Outbound**.

## package.json scripts

```json
{
  "scripts": {
    "start": "tsx server.ts",
    "dev": "tsx watch server.ts"
  },
  "dependencies": {
    "hono": "^4.7.2",
    "@hono/node-server": "^1.13.8"
  },
  "devDependencies": {
    "tsx": "^4.19.3"
  }
}
```

Install once locally, commit `package-lock.json`, push; Railway runs `npm install` then `npm start`.

## Quick health check after deploy

Open these in the browser (replace with your domain):

1. `https://YOUR.up.railway.app/` → Lunar home  
2. `https://YOUR.up.railway.app/proxy?url=https%3A%2F%2Fexample.com` → should show example.com HTML  
3. `https://YOUR.up.railway.app/view?url=https%3A%2F%2Fhtml.duckduckgo.com%2Fhtml%2F` → viewer + DDG  

If (1) works but (2) returns JSON `{ "error": "..." }`, the server is up and the proxy path is the problem (blocked upstream, timeout, etc.).  
If (1) fails entirely, start command / PORT / domain is wrong — check **Deploy Logs**.

## Why monoxide.dev works for TikTok and Lunar often doesn’t

Sites like **monoxide.dev** (and most “school proxies”) are **not** simple server-side HTML fetchers.

They usually use:

- **Service workers** in the browser (Ultraviolet, Scramjet, etc.)
- **Full JS/URL rewriting** so the page thinks it’s still on tiktok.com
- Sometimes **Bare / Wisp / libcurl** transports so the browser doesn’t talk to blocked hosts directly

Your Lunar code is a **classic server proxy**:

```
browser → Railway /proxy → fetch(target) → rewrite HTML → browser
```

That is fine for static / simple sites. It breaks on:

| Site | Why |
|------|-----|
| TikTok / Instagram / X | Heavy client apps, strict origin checks, bot detection |
| Google / Bing | CAPTCHA bound to their domain + datacenter IP blocks |
| Netflix / Spotify | DRM, auth, streaming protocols |

**Railway’s IP is a datacenter IP.** Google, Bing, TikTok, etc. often soft-block or CAPTCHA those. monoxide.dev may use residential-like egress, better rewriting, or both.

### Realistic options if you need TikTok-level support

1. **Keep Lunar** for simple browsing + embeds (YouTube/TikTok official embed players you already have).  
2. **Add Scramjet / Ultraviolet** as a second engine (much more work; needs service worker + bare server).  
3. **Don’t expect** a pure `fetch()` HTML proxy on Railway to fully replace monoxide-style proxies.

## Debugging “nothing happens” on Search

1. Open browser **DevTools → Network**.  
2. Submit a search.  
3. You should see a navigation to `/view?url=...` then the iframe request `/proxy?url=...`.  
4. Click the `/proxy` request:
   - **502 / JSON error** → upstream failed (timeout, blocked host, TLS) — check Railway logs  
   - **405** → method allow-list bug (already fixed in the patched file)  
   - **empty / CORS** → rewrite or response headers  
   - **never fires** → JS error on the home page (console tab)

Also watch **Railway → Deployments → Logs** while you search; proxy errors are logged there if you add `console.error`.

## Minimal server.ts (copy into repo)

```ts
import { serve } from "@hono/node-server";
import app from "./app";

const port = Number(process.env.PORT) || 3000;

serve({
  fetch: app.fetch,
  port,
  hostname: "0.0.0.0",
});
```

Rename your Hono file to `app.ts` and end it with `export default app` (already does).

## Checklist

- [ ] `package.json` with `hono`, `@hono/node-server`, `tsx`
- [ ] `server.ts` listens on `process.env.PORT` and `0.0.0.0`
- [ ] Start command: `npm start` or `npx tsx server.ts`
- [ ] Public domain generated in Railway
- [ ] Deploy logs show `[lunar] starting on 0.0.0.0:XXXX`
- [ ] `/proxy?url=https://example.com` returns HTML
- [ ] Use DuckDuckGo HTML for search, not Google/Bing, on datacenter IPs
