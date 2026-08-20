import { Hono } from "hono";

const app = new Hono();

const LUNAR_CHROME = `

<style id="lunar-cursor-style">
  html, body, a, button, input, textarea, select, [role="button"] { cursor: none !important; }
  #lunar-cursor {
    position: fixed;
    left: 0; top: 0;
    width: 22px; height: 22px;
    pointer-events: none;
    z-index: 2147483647;
    transform: translate3d(-100px,-100px,0);
    opacity: 0;
    will-change: transform;
    transition: transform .08s ease, opacity .12s ease, filter .12s ease;
  }
  /* Crescent moon cursor */
  #lunar-cursor::before {
    content: "";
    position: absolute;
    left: 2px; top: 2px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 0 7px rgba(255,255,255,.55), 0 0 18px rgba(190,210,255,.28);
  }
  #lunar-cursor::after {
    content: "";
    position: absolute;
    left: 8px; top: -1px;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #000;
    box-shadow: 0 0 3px rgba(0,0,0,.5);
    transition: transform .12s ease, opacity .12s ease;
  }
  #lunar-cursor.hover::before {
    box-shadow: 0 0 8px rgba(255,255,255,.75), 0 0 22px rgba(190,210,255,.4);
  }
  #lunar-cursor.hover::after { transform: translate(-1px,1px); }
  #lunar-cursor.down::before { transform: scale(.86); }
  @media (pointer: coarse) {
    html, body, a, button, input, textarea, select, [role="button"] { cursor: auto !important; }
    #lunar-cursor { display:none !important; }
  }
</style>

<div id="lunar-cursor" aria-hidden="true"></div>
<script>
(function(){
  if (window.__lunarCursorInstalled) return;
  window.__lunarCursorInstalled = true;
  const c = document.getElementById("lunar-cursor");
  if (!c || !window.matchMedia || window.matchMedia("(pointer: coarse)").matches) return;
  let tx=-100, ty=-100, x=-100, y=-100, active=false;
  const interactive = "a,button,input,textarea,select,[role=button],[onclick],[tabindex]:not([tabindex='-1'])";
  function setHover(on){ c.classList.toggle("hover", !!on); }
  function frame(){
    x += (tx-x)*0.28; y += (ty-y)*0.28;
    c.style.transform = "translate3d("+(x-11)+"px,"+(y-11)+"px,0)";
    requestAnimationFrame(frame);
  }
  document.addEventListener("mousemove", e=>{
    tx=e.clientX; ty=e.clientY;
    if(!active){ x=tx; y=ty; active=true; c.style.opacity="1"; }
    const el=e.target && e.target.closest ? e.target.closest(interactive) : null;
    setHover(!!el);
  }, {passive:true, capture:true});
  document.addEventListener("mouseover", e=>{
    const el=e.target && e.target.closest ? e.target.closest(interactive) : null;
    setHover(!!el);
  }, {passive:true, capture:true});
  document.addEventListener("mousedown",()=>c.classList.add("down"),true);
  document.addEventListener("mouseup",()=>c.classList.remove("down"),true);
  document.addEventListener("mouseleave",()=>{active=false;c.style.opacity="0";setHover(false);},{passive:true});
  frame();
})();
</script>`;

const HOME_SIDEBAR = `

<style>
#lunar-home-sidebar{position:fixed;left:0;top:0;bottom:0;width:224px;z-index:9999;padding:18px 12px;background:rgba(9,9,12,.82);border-right:1px solid rgba(255,255,255,.09);backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);box-shadow:18px 0 50px rgba(0,0,0,.25)}
#lunar-home-sidebar .lhs-brand{padding:8px 12px 26px;font-size:18px;font-weight:750;letter-spacing:-.5px;color:#fff}
#lunar-home-sidebar .lhs-sub{font-size:10px;color:#666;font-weight:500;margin-top:3px;letter-spacing:.5px}
#lunar-home-sidebar .lhs-label{font-size:9px;letter-spacing:1.4px;color:#555;font-weight:700;padding:0 12px 8px}
#lunar-home-sidebar nav{display:flex;flex-direction:column;gap:5px}
#lunar-home-sidebar button{width:100%;border:1px solid transparent;background:transparent;color:#9b9b9b;text-align:left;padding:11px 12px;border-radius:10px;font:inherit;font-size:13px;transition:.18s ease}
#lunar-home-sidebar button:hover,#lunar-home-sidebar button.active{color:#fff;background:rgba(255,255,255,.08);border-color:rgba(255,255,255,.10);transform:translateX(2px)}
#lunar-home-sidebar .lhs-bottom{position:absolute;left:12px;right:12px;bottom:18px;font-size:10px;color:#4d4d4d;padding:10px 12px}
body.lunar-home .container{margin-left:224px;max-width:calc(100% - 224px);padding-left:40px;padding-right:40px}
@media(max-width:760px){#lunar-home-sidebar{width:70px;padding:12px 8px}#lunar-home-sidebar .lhs-brand{font-size:0;text-align:center;padding:10px 4px 22px}#lunar-home-sidebar .lhs-brand::before{content:"L";font-size:20px}#lunar-home-sidebar .lhs-sub,#lunar-home-sidebar .lhs-label,#lunar-home-sidebar .lhs-bottom{display:none}#lunar-home-sidebar button{text-align:center;font-size:0;padding:12px 5px}#lunar-home-sidebar button::first-letter{font-size:14px}body.lunar-home .container{margin-left:70px;max-width:calc(100% - 70px);padding-left:18px;padding-right:18px}}
</style>

<aside id="lunar-home-sidebar">
<div class="lhs-brand">Lunar<div class="lhs-sub">Proxy</div></div>
<div class="lhs-label">NAVIGATION</div>
<nav>
<button class="active" onclick="location.href='/'">⌂ Home</button>
<button onclick="location.href='/page/games'">◈ Games</button>
<button onclick="location.href='/page/media'">▶ Media</button>
<button onclick="location.href='/page/chat'">◇ Chat</button>
<button onclick="location.href='/page/emulator'">▣ Emulator</button>
<button onclick="location.href='/page/ai'">✦ AI</button>
</nav>
<div class="lhs-bottom">Fast web access · Lunar</div>
</aside>`;

const AD_DOMAINS = [
"google-analytics.com","googleadsservices.com","googlesyndication.com",
"doubleclick.net","ads.google.com","facebook.com/tr","connect.facebook.net",
"analytics.google.com","pagead2.googlesyndication.com","adservice.google.com",
"pagead.google.com","googletagmanager.com","amazon-adsystem.com",
"criteo.com","outbrain.com","taboola.com","scorecardsresearch.com",
"quantserve.com","addthis.com","sharethis.com","moatads.com",
];

// ─── SITE CONFIG ────────────────────────────────────────────────────
const SITE_CONFIG: Record<string, { www: string; path?: string; headers?: Record<string,string>; noJs?: boolean }> = {
"tiktok.com": { www: "www.tiktok.com", path: "/discover", noJs: true },
"youtube.com": { www: "www.youtube.com" },
"youtu.be": { www: "youtu.be" },
"twitter.com": { www: "www.twitter.com", noJs: true },
"x.com": { www: "www.x.com", noJs: true },
"instagram.com": { www: "www.instagram.com", noJs: true },
"reddit.com": { www: "www.reddit.com" },
"spotify.com": { www: "open.spotify.com", noJs: false },
"twitch.tv": { www: "www.twitch.tv", noJs: true },
"discord.com": { www: "discord.com" },
"netflix.com": { www: "www.netflix.com", noJs: true },
};

function normalizeUrl(url: string): string {
if (!url.startsWith("http://") && !url.startsWith("https://")) {
url = "https://" + url;
}
const parsed = new URL(url);
const config = SITE_CONFIG[parsed.hostname];
if (config) {
parsed.hostname = config.www;
if (config.path && (!parsed.pathname || parsed.pathname === "/")) {
parsed.pathname = config.path;
}
}
return parsed.href;
}

function toProxy(u: string, baseHref: string): string {
if (!u || u.startsWith("data:") || u.startsWith("javascript:") ||
u.startsWith("mailto:") || u.startsWith("tel:") || u.startsWith("#")) return u;
if (u.startsWith("/proxy?url=") || u.startsWith("/view?url=")) return u;
try {
const abs = new URL(u, baseHref).href;
return "/proxy?url=" + encodeURIComponent(abs);
} catch { return u; }
}

// ─── VIEWER ─────────────────────────────────────────────────────────
app.get("/view", (c) => {
  const targetUrl = c.req.query("url") || "";
  let decoded = targetUrl;

  try {
    decoded = decodeURIComponent(targetUrl);
  } catch {
    decoded = targetUrl;
  }

  // Use first-party embedded players for supported video URLs.
  const youtubeMatch =
    decoded.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/i);

  if (youtubeMatch) {
    return c.redirect(
      "/embed/youtube/watch?v=" + encodeURIComponent(youtubeMatch[1])
    );
  }

  const tiktokMatch =
    decoded.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/i) ||
    decoded.match(/tiktok\.com\/player\/v1\/(\d+)/i);

  if (tiktokMatch) {
    return c.redirect(
      "/embed/tiktok?v=" + encodeURIComponent(tiktokMatch[1])
    );
  }

  const html = `<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lunar Proxy</title>
${LUNAR_CHROME}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
:root { --bg: #000; --surface: #111; --border: #222; --text: #fff; --text-secondary: #888; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); height: 100vh; overflow: hidden; display: flex; flex-direction: column; }
#viewer-shell { height: 100vh; display: flex; }
#viewer-sidebar { width: 190px; flex-shrink: 0; background: #0a0a0a; border-right: 1px solid var(--border); padding: 16px 10px; }
.viewer-brand { font-weight: 700; padding: 8px 10px 22px; }
.viewer-nav { width: 100%; border: 1px solid transparent; background: transparent; color: #aaa; text-align: left; padding: 10px; border-radius: 8px; cursor: pointer; margin-bottom: 4px; font-size: 13px; }
.viewer-nav:hover { background: #171717; color: #fff; border-color: #222; }
#viewer-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
#topbar { height: 56px; background: var(--surface); border-bottom: 1px solid var(--border); display: flex; align-items: center; gap: 8px; padding: 0 16px; flex-shrink: 0; }
#topbar .btn { background: transparent; border: 1px solid var(--border); color: var(--text); width: 32px; height: 32px; border-radius: 8px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; transition: all 0.15s; flex-shrink: 0; }
#topbar .btn:hover { background: #1a1a1a; border-color: #444; }
#topbar .home-btn { width: auto; padding: 0 14px; font-size: 13px; font-weight: 500; }
#urlbar { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 8px; padding: 8px 14px; color: var(--text); font-size: 13px; outline: none; min-width: 0; }
#urlbar:focus { border-color: #444; }
#frame-wrap { flex: 1; position: relative; background: var(--bg); }
iframe { width: 100%; height: 100%; border: none; display: block; }
#loading { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text-secondary); font-size: 14px; pointer-events: none; opacity: 0; transition: opacity 0.2s; }
#loading.active { opacity: 1; }
#error { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: var(--text); text-align: center; display: none; }
#error.active { display: block; }
</style>
</head>
<body>
<div id="viewer-shell">
<aside id="viewer-sidebar">
  <div class="viewer-brand">Lunar</div>
  <button class="viewer-nav" onclick="window.location.href='/'">Home</button>
  <button class="viewer-nav" onclick="window.location.href='/page/games'">Games</button>
  <button class="viewer-nav" onclick="window.location.href='/page/media'">Media</button>
  <button class="viewer-nav" onclick="window.location.href='/page/chat'">Chat</button>
  <button class="viewer-nav" onclick="window.location.href='/page/emulator'">Emulator</button>
  <button class="viewer-nav" onclick="window.location.href='/page/ai'">AI</button>
</aside>
<div id="viewer-main">
<div id="topbar">
  <button class="btn" onclick="history.back()" title="Back">←</button>
  <button class="btn" onclick="history.forward()" title="Forward">→</button>
  <button class="btn" onclick="reloadFrame()" title="Refresh">↻</button>
  <input type="text" id="urlbar" value="${decoded.replace(/"/g, '&quot;')}" placeholder="Enter URL or search...">
  <button class="btn home-btn" onclick="window.location.href='/'" title="Home">Lunar</button>
</div>
<div id="frame-wrap">
  <div id="loading" class="active">Loading...</div>
  <div id="error">
    <h2>Unable to load</h2>
    <p style="color: var(--text-secondary); margin-top: 8px;">This site may block proxy access.</p>
    <button onclick="openDirect()" style="margin-top: 16px; padding: 8px 16px; background: var(--text); color: var(--bg); border: none; border-radius: 8px; cursor: pointer;">Open Directly</button>
  </div>
  <iframe id="viewer" 
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-downloads allow-modals allow-pointer-lock allow-presentation"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen; geolocation; microphone; camera; display-capture"
    src="/proxy?url=${encodeURIComponent(decoded)}">
  </iframe>
</div>
<script>
const urlbar = document.getElementById('urlbar');
const iframe = document.getElementById('viewer');
const loading = document.getElementById('loading');
const error = document.getElementById('error');
let loadTimer;

function onLoad() {
clearTimeout(loadTimer);
loading.classList.remove('active');
}
function onError() {
loading.classList.remove('active');
error.classList.add('active');
}

iframe.addEventListener('load', onLoad);

loadTimer = setTimeout(() => {
try {
const doc = iframe.contentDocument;
if (!doc || doc.body.innerHTML.trim() === '') {
onError();
} else {
onLoad();
}
} catch(e) {
onLoad();
}
}, 10000);

function reloadFrame() {
iframe.src = iframe.src;
loading.classList.add('active');
error.classList.remove('active');
loadTimer = setTimeout(() => {
try {
const doc = iframe.contentDocument;
if (!doc || doc.body.innerHTML.trim() === '') onError();
} catch(e) {}
}, 10000);
}

function openDirect() {
window.open(urlbar.value, '_blank');
}

urlbar.addEventListener('keydown', (e) => {
if (e.key !== 'Enter') return;
let val = urlbar.value.trim();
if (!val) return;
const isUrl = /^https?:\/\//.test(val) || (val.includes('.') && !val.includes(' ') && val.length > 3);
let dest = isUrl ? (val.startsWith('http') ? val : 'https://' + val) : 'https://html.duckduckgo.com/html/?q=' + encodeURIComponent(val);
window.location.href = '/view?url=' + encodeURIComponent(dest);
});
</script>

</body>
</html>`;

return c.html(html);
});

// ─── PROXY ──────────────────────────────────────────────────────────
const HOP_BY_HOP = new Set([
"connection", "keep-alive", "proxy-authenticate", "proxy-authorization",
"te", "trailer", "transfer-encoding", "upgrade"
]);

const STRIP_RESPONSE_HEADERS = new Set([
"content-security-policy", "content-security-policy-report-only",
"x-frame-options", "frame-options", "cross-origin-opener-policy",
"cross-origin-embedder-policy", "cross-origin-resource-policy"
]);

const SAFE_REQUEST_HEADERS = [
"accept", "accept-language", "cache-control", "content-type", "cookie",
"dnt", "if-match", "if-modified-since", "if-none-match", "if-range",
"origin", "range", "referer", "user-agent", "x-requested-with"
];

function buildUpstreamHeaders(c: any, target: URL) {
const headers = new Headers();
for (const name of SAFE_REQUEST_HEADERS) {
const value = c.req.header(name);
if (value) headers.set(name, value);
}

const ua =
c.req.header("user-agent") ||
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

headers.set("User-Agent", ua);
headers.set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,/;q=0.8");
headers.set("Accept-Language", c.req.header("accept-language") || "en-US,en;q=0.9");
headers.set("Cache-Control", "no-cache");
headers.set("Pragma", "no-cache");
headers.set("Upgrade-Insecure-Requests", "1");
headers.set("Sec-Fetch-Dest", "document");
headers.set("Sec-Fetch-Mode", "navigate");
headers.set("Sec-Fetch-Site", "none");
headers.set("Sec-Fetch-User", "?1");
headers.set("sec-ch-ua", '"Chromium";v="122", "Not(A";v="24", "Google Chrome";v="122"');
headers.set("sec-ch-ua-mobile", "?0");
headers.set("sec-ch-ua-platform", '"Windows"');
headers.set("Referer", target.origin + "/");

const host = target.hostname.toLowerCase();
if (host === "youtube.com" || host.endsWith(".youtube.com") || host === "youtu.be") {
headers.set("Referer", "https://www.youtube.com/");
headers.set("Origin", "https://www.youtube.com");
} else if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
headers.set("Referer", "https://www.tiktok.com/");
headers.set("Origin", "https://www.tiktok.com");
} else if (host === "instagram.com" || host.endsWith(".instagram.com")) {
headers.set("Referer", "https://www.instagram.com/");
headers.set("Origin", "https://www.instagram.com");
} else if (host === "x.com" || host.endsWith(".x.com") || host === "twitter.com") {
headers.set("Referer", "https://x.com/");
headers.set("Origin", "https://x.com");
} else if (host === "spotify.com" || host.endsWith(".spotify.com")) {
headers.set("Referer", "https://open.spotify.com/");
headers.set("Origin", "https://open.spotify.com");
} else if (host === "twitch.tv" || host.endsWith(".twitch.tv")) {
headers.set("Referer", "https://www.twitch.tv/");
} else if (host === "google.com" || host.endsWith(".google.com")) {
headers.set("Referer", "https://www.google.com/");
headers.set("Origin", "https://www.google.com");
} else if (host === "bing.com" || host.endsWith(".bing.com")) {
headers.set("Referer", "https://www.bing.com/");
headers.set("Origin", "https://www.bing.com");
} else if (host.includes("duckduckgo.com")) {
headers.set("Referer", "https://html.duckduckgo.com/");
}

headers.set("Accept-Encoding", "identity");
return headers;
}

function rewriteCookieForProxy(raw: string, upstreamHost: string) {
  const firstSemi = raw.indexOf(";");
  const first = firstSemi >= 0 ? raw.slice(0, firstSemi) : raw;
  const rest = firstSemi >= 0 ? raw.slice(firstSemi) : "";
  const eq = first.indexOf("=");

  if (eq < 1) return null;

  const name = first.slice(0, eq);
  const value = first.slice(eq + 1);
  const safeHost = upstreamHost.replace(/[^a-z0-9]/gi, "_");

  return `__lunar_${safeHost}_${name}=${value}${rest
    .replace(/;\s*Domain=[^;]*/ig, "")
    .replace(/;\s*SameSite=None/ig, "; SameSite=Lax")}; Path=/`;
}

function cookiesForUpstream(c: any, upstreamHost: string) {
  const cookie = c.req.header("cookie") || "";
  if (!cookie) return "";

  const safeHost = upstreamHost.replace(/[^a-z0-9]/gi, "_");
  const prefix = `__lunar_${safeHost}_`;

  return cookie
    .split(";")
    .map((part: string) => part.trim())
    .filter((part: string) => part.startsWith(prefix))
    .map((part: string) => part.slice(prefix.length))
    .join("; ");
}

function rewriteTextUrls(text: string, baseHref: string) {
  text = text.replace(
    /\bhref\s*=\s*(['"])([^'"]+)\1/gi,
    (m, q, u) => {
      if (/^(?:#|javascript:|mailto:|tel:|data:|blob:)/i.test(u)) {
        return m;
      }

      return `href=${q}${toProxy(u, baseHref)}${q}`;
    }
  );

  text = text.replace(
    /\bsrc\s*=\s*(['"])([^'"]+)\1/gi,
    (m, q, u) => {
      if (/^(?:#|javascript:|mailto:|tel:|data:|blob:)/i.test(u)) {
        return m;
      }

      return `src=${q}${toProxy(u, baseHref)}${q}`;
    }
  );

  for (const attr of [
    "poster",
    "data-src",
    "data-original",
    "data-lazy-src",
  ]) {
    const re = new RegExp(
      `\\b${attr}\\s*=\\s*(['"])([^'"]+)\\1`,
      "gi"
    );

    text = text.replace(re, (m, q, u) => {
      if (/^(?:data:|blob:|javascript:)/i.test(u)) {
        return m;
      }

      return `${attr}=${q}${toProxy(u, baseHref)}${q}`;
    });
  }

  text = text.replace(
    /\bsrcset\s*=\s*(['"])([^'"]+)\1/gi,
    (m, q, srcset) => {
      const rewritten = srcset
        .split(",")
        .map((part: string) => {
          const bits = part.trim().split(/\s+/);

          if (!bits[0] || /^(?:data:|blob:)/i.test(bits[0])) {
            return part;
          }

          bits[0] = toProxy(bits[0], baseHref);
          return bits.join(" ");
        })
        .join(", ");

      return `srcset=${q}${rewritten}${q}`;
    }
  );

  text = text.replace(
    /\baction\s*=\s*(['"])([^'"]+)\1/gi,
    (m, q, u) => {
      if (/^(?:#|javascript:|mailto:|tel:)/i.test(u)) {
        return m;
      }

      return `action=${q}${toProxy(u, baseHref)}${q}`;
    }
  );

  text = text.replace(
    /url\(\s*(['"]?)([^'")\s]+)\1\s*\)/gi,
    (m, q, u) => {
      if (/^(?:data:|blob:)/i.test(u)) {
        return m;
      }

      return `url("${toProxy(u, baseHref)}")`;
    }
  );

  text = text.replace(
    /http-equiv=["']refresh["'][^>]*content=["']([^"']*)["']/gi,
    (m, content) => {
      return m.replace(
        content,
        content.replace(
          /url=([^;\s]+)/i,
          (_, u) => "url=" + toProxy(u.trim(), baseHref)
        )
      );
    }
  );

  return text;
}

app.all("/proxy", async (c) => {
  let targetUrl = c.req.query("url");

  if (!targetUrl) {
    return c.json({ error: "URL required" }, 400);
  }

  try {
    if (!/^https?:\/\//i.test(targetUrl) && /%3A%2F%2F/i.test(targetUrl)) {
      targetUrl = decodeURIComponent(targetUrl);
    }
  } catch {}

  try {
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = "https://" + targetUrl;
    }

    const target = new URL(targetUrl);

const incomingUrl = new URL(c.req.url);
for (const [key, value] of incomingUrl.searchParams) {
  if (key !== "url") target.searchParams.append(key, value);
}

const hostname = target.hostname.toLowerCase();
const blockedHost =
  hostname === "localhost" ||
  hostname === "127.0.0.1" ||
  hostname === "::1" ||
  hostname === "0.0.0.0" ||
  hostname.endsWith(".local") ||
  hostname.endsWith(".internal");

if (blockedHost) {
  return c.json({ error: "Blocked target" }, 403);
}

const method = c.req.method.toUpperCase();
if (!["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].includes(method)) {
  return c.json({ error: "Method not allowed" }, 405);
}

const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 25000);

try {
  const headers = buildUpstreamHeaders(c, target);

  const storedCookies = cookiesForUpstream(c, hostname);
  if (storedCookies) headers.set("Cookie", storedCookies);

  let body: ArrayBuffer | undefined;
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    body = await c.req.raw.arrayBuffer();
    headers.delete("content-length");
  }

  const upstream = await fetch(target.href, {
    method,
    headers,
    body,
    redirect: "follow",
    signal: controller.signal
  });

  const finalUrl = upstream.url || target.href;
  const finalParsed = new URL(finalUrl);
  const finalHost = finalParsed.hostname.toLowerCase();

  if (
    finalHost === "localhost" ||
    finalHost === "127.0.0.1" ||
    finalHost === "::1" ||
    finalHost === "0.0.0.0" ||
    finalHost.endsWith(".local") ||
    finalHost.endsWith(".internal")
  ) {
    try { await upstream.body?.cancel(); } catch {}
    return c.json({ error: "Blocked redirect target" }, 403);
  }

  const contentType = (upstream.headers.get("content-type") || "").toLowerCase();
  const isHtml = contentType.includes("text/html") ||
    contentType.includes("application/xhtml+xml");
  const isCss = contentType.includes("text/css");
  const isJs = /javascript|ecmascript/.test(contentType);
  const isText = isHtml || isCss || isJs ||
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("xml");

  const out = new Headers();

  upstream.headers.forEach((value, key) => {
    const lower = key.toLowerCase();

    if (
      HOP_BY_HOP.has(lower) ||
      STRIP_RESPONSE_HEADERS.has(lower) ||
      lower === "set-cookie" ||
      lower === "content-encoding" ||
      lower === "content-length"
    ) {
      return;
    }

    out.set(key, value);
  });

  // Non-text assets are streamed directly.
  if (!isText) {
    out.set("Access-Control-Allow-Origin", "*");
    out.set(
      "Access-Control-Expose-Headers",
      "Accept-Ranges, Content-Length, Content-Range, Content-Type, ETag, Last-Modified"
    );

    const range = upstream.headers.get("content-range");
    if (range) out.set("Content-Range", range);

    const acceptRanges = upstream.headers.get("accept-ranges");
    if (acceptRanges) out.set("Accept-Ranges", acceptRanges);

    return new Response(upstream.body, {
      status: upstream.status,
      headers: out
    });
  }

  // Keep proxied cookies host-isolated.
  const getSetCookie = (upstream.headers as any).getSetCookie;
  if (typeof getSetCookie === "function") {
    for (const raw of getSetCookie.call(upstream.headers)) {
      const rewritten = rewriteCookieForProxy(raw, finalParsed.hostname);
      if (rewritten) out.append("Set-Cookie", rewritten);
    }
  } else {
    const raw = upstream.headers.get("set-cookie");
    if (raw) {
      const rewritten = rewriteCookieForProxy(raw, finalParsed.hostname);
      if (rewritten) out.append("Set-Cookie", rewritten);
    }
  }

  // Protect the Railway process from unexpectedly huge HTML/JS responses.
  const MAX_TEXT_BYTES = 8 * 1024 * 1024;
  const declaredLength = Number(upstream.headers.get("content-length") || 0);

  if (declaredLength > MAX_TEXT_BYTES) {
    try { await upstream.body?.cancel(); } catch {}
    return c.json({
      error: "Upstream response too large",
      message: "The page returned more than 8 MB of text."
    }, 413);
  }

  const text = await upstream.text();

  if (text.length > MAX_TEXT_BYTES) {
    return c.json({
      error: "Upstream response too large",
      message: "The page returned more than 8 MB of text."
    }, 413);
  }

  let rewritten = text;

  if (isCss) {
    rewritten = rewriteTextUrls(rewritten, finalUrl);
    out.set("Content-Type", "text/css; charset=utf-8");
  } else if (isJs) {
    out.set("Content-Type", contentType.includes("javascript")
      ? "application/javascript; charset=utf-8"
      : contentType);
  } else if (isHtml) {
    rewritten = rewriteTextUrls(rewritten, finalUrl);

    rewritten = rewritten
      .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, "")
      .replace(/<meta[^>]+http-equiv=["']X-Frame-Options["'][^>]*>/gi, "")
      .replace(/<base\b[^>]*>/gi, "");

    const baseTag = `<base href="${finalUrl.replace(/"/g, "&quot;")}">`;

    const helper = `<script>

(function(){
try {
const PROXY = ${JSON.stringify("/proxy?url=")};
const TARGET = ${JSON.stringify(finalUrl)};
const TARGET_ORIGIN = new URL(TARGET).origin;

function proxied(input) {
  let raw = typeof input === "string" ? input : (input && input.url) || "";
  if (!raw || /^(?:data:|blob:|javascript:|mailto:|tel:|#)/i.test(raw)) return raw;
  try {
    const absolute = new URL(raw, TARGET).href;
    if (absolute.startsWith(location.origin + "/proxy?url=")) return absolute;
    if (/^https?:\\/\\//i.test(absolute)) return PROXY + encodeURIComponent(absolute);
  } catch(e) {}
  return raw;
}

const nativeFetch = window.fetch;
if (nativeFetch) {
  window.fetch = function(input, init){
    try {
      if (typeof input === "string") return nativeFetch.call(this, proxied(input), init);
      if (input && input.url) {
        const next = proxied(input.url);
        if (next !== input.url) return nativeFetch.call(this, next, init);
      }
    } catch(e) {}
    return nativeFetch.call(this, input, init);
  };
}

const nativeOpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, async, user, password){
  return nativeOpen.call(this, method, proxied(url), async, user, password);
};

function rewriteAnchor(a){
  if(!a) return;
  const href=a.getAttribute("href");
  if(!href || /^(?:#|javascript:|mailto:|tel:|data:|blob:)/i.test(href)) return;
  try { a.setAttribute("href", proxied(href)); } catch(e) {}
}
document.addEventListener("click",function(e){
  const a=e.target && e.target.closest ? e.target.closest("a") : null;
  if(a) rewriteAnchor(a);
},true);

document.addEventListener("submit",function(e){
  const form=e.target;
  if(!form || !form.action) return;
  try { form.action=proxied(form.action); } catch(err) {}
},true);

document.addEventListener("click",function(e){
  const a=e.target && e.target.closest ? e.target.closest("a") : null;
  if(a && a.target === "_blank") a.target="_self";
},true);

window.__LUNAR_PROXY_TARGET__ = TARGET;
window.__LUNAR_PROXY_ORIGIN__ = TARGET_ORIGIN;

} catch(e) {}
})();
</script>`

    const lunarChrome = LUNAR_CHROME;
    if (/<head\b[^>]*>/i.test(rewritten)) {
      rewritten = rewritten.replace(/(<head\b[^>]*>)/i, "$1" + baseTag + lunarChrome + helper);
    } else {
      rewritten = baseTag + lunarChrome + helper + rewritten;
    }

    const blocked =
      /unusual traffic|detected unusual traffic|are you a robot|invalid domain for site key|our systems have detected/i.test(rewritten) ||
      (/bing\.com/i.test(finalUrl) && /page not found/i.test(rewritten));
    if (blocked) {
      const notice = `<div id="lunar-block-notice" style="position:fixed;inset:0;z-index:2147483646;background:rgba(0,0,0,.92);color:#fff;font:14px/1.5 system-ui,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center">
        <div style="max-width:420px">
          <div style="font-size:28px;margin-bottom:12px">⚠</div>
          <h2 style="margin:0 0 8px;font-size:18px">This site is blocking the proxy</h2>
          <p style="color:#aaa;margin:0 0 18px">Google and Bing often show CAPTCHAs or soft 404s to datacenter IPs. DuckDuckGo works more reliably through Lunar.</p>
          <a href="/view?url=${encodeURIComponent("https://html.duckduckgo.com/html/")}" style="display:inline-block;padding:10px 16px;background:#fff;color:#000;border-radius:10px;text-decoration:none;font-weight:600;margin:0 6px 8px">Try DuckDuckGo</a>
          <a href="${finalUrl.replace(/"/g, "&quot;")}" target="_blank" rel="noopener" style="display:inline-block;padding:10px 16px;border:1px solid #444;color:#fff;border-radius:10px;text-decoration:none;margin:0 6px 8px">Open site directly</a>
          <div style="margin-top:14px"><button onclick="document.getElementById('lunar-block-notice').remove()" style="background:transparent;border:none;color:#666;cursor:pointer;text-decoration:underline">Dismiss</button></div>
        </div>
      </div>`;
      if (/<body\b[^>]*>/i.test(rewritten)) {
        rewritten = rewritten.replace(/(<body\b[^>]*>)/i, "$1" + notice);
      } else {
        rewritten = notice + rewritten;
      }
    }

    out.set("Content-Type", "text/html; charset=utf-8");
  } else {
    out.set("Content-Type", contentType || "text/plain; charset=utf-8");
  }

  out.set("Access-Control-Allow-Origin", "*");
  out.set("Access-Control-Allow-Methods", "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS");
  out.set("Access-Control-Allow-Headers", "*");

  return new Response(method === "HEAD" ? null : rewritten, {
    status: upstream.status,
    headers: out
  });
} finally {
  clearTimeout(timeout);
}

} catch (err: any) {
const message =
err?.name === "AbortError"
? "The upstream site took too long to respond."
: (err?.message || "Unknown upstream error");

return c.json({
  error: "Proxy request failed",
  message
}, 502);

}
});

app.options("/proxy", (c) => new Response(null, {
status: 204,
headers: {
"Access-Control-Allow-Origin": "",
"Access-Control-Allow-Methods": "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS",
"Access-Control-Allow-Headers": ""
}
}));

// ─── EMBEDDED APPS ──────────────────────────────────────────────────
app.get("/embed/youtube", (c) => {
const q = c.req.query("q") || "";
return c.html(`<!DOCTYPE html>

<html>
<head><title>YouTube - Lunar</title>
<style>body{margin:0;background:#000;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:sans-serif;color:#fff;}
#search{padding:12px 20px;width:400px;max-width:90%;border-radius:24px;border:none;background:#222;color:#fff;font-size:16px;outline:none;margin-bottom:20px;}
.btn{padding:10px 24px;background:#ff0000;border:none;border-radius:20px;color:#fff;cursor:pointer;font-weight:600;}
.results{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;padding:20px;width:100%;max-width:1200px;}
.video{background:#111;border-radius:8px;overflow:hidden;cursor:pointer;transition:transform 0.15s;}
.video:hover{transform:scale(1.02);}
.thumb{width:100%;aspect-ratio:16/9;background:#222;}
.title{padding:12px;font-size:14px;}
</style></head>
<body>
<input type="text" id="search" placeholder="Search YouTube..." value="${q.replace(/"/g,'&quot;')}" onkeydown="if(event.key==='Enter')doSearch()">
<button class="btn" onclick="doSearch()">Search</button>
<div class="results" id="results"></div>
<script>
function doSearch(){
  const q=document.getElementById('search').value.trim();
  if(!q)return;
  fetch('/proxy?url='+encodeURIComponent('https://www.youtube.com/results?search_query='+encodeURIComponent(q)))
    .then(r=>r.text()).then(html=>{
      const parser=new DOMParser();
      const doc=parser.parseFromString(html,'text/html');
      const vids=[...doc.querySelectorAll('a[href^="/watch"]')].slice(0,12);
      const container=document.getElementById('results');
      container.innerHTML='';
      vids.forEach(a=>{
        const href=a.getAttribute('href');
        const title=a.querySelector('#video-title, .yt-formatted-string')?.textContent||'Video';
        const id=href.match(/v=([^&]+)/)?.[1];
        if(!id)return;
        const div=document.createElement('div');
        div.className='video';
        div.innerHTML='<img class="thumb" src="https://i.ytimg.com/vi/'+id+'/mqdefault.jpg"><div class="title">'+title.replace(/</g,'&lt;')+'</div>';
        div.onclick=()=>window.location.href='/embed/youtube/watch?v='+id;
        container.appendChild(div);
      });
    });
}
if('${q}')doSearch();
</script>
</body></html>`);
});

app.get("/embed/youtube/watch", (c) => {
const v = c.req.query("v") || "";
return c.html(`<!DOCTYPE html>

<html>
<head><title>YouTube - Lunar</title>
<style>body{margin:0;background:#000;height:100vh;display:flex;align-items:center;justify-content:center;}
iframe{width:100%;height:100%;border:none;}
.back{position:fixed;top:16px;left:16px;background:rgba(0,0,0,0.8);color:#fff;padding:8px 16px;border-radius:8px;text-decoration:none;font-family:sans-serif;font-size:14px;z-index:100;}
</style></head>
<body>
<a href="/embed/youtube" class="back">← Back</a>
<iframe src="https://www.youtube.com/embed/${v}?autoplay=1&rel=0" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"></iframe>
</body></html>`);
});

app.get("/embed/tiktok", (c) => {
const id = (c.req.query("v") || "").replace(/[^0-9]/g, "");
if (!id) return c.redirect("/");

return c.html(`<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>TikTok · Lunar</title>
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;height:100%;background:#050505;color:#fff;font-family:system-ui,-apple-system,Segoe UI,sans-serif}
body{display:flex;align-items:center;justify-content:center;overflow:hidden}
.card{width:min(980px,94vw);height:min(860px,94vh);display:flex;flex-direction:column;
  background:rgba(18,18,18,.86);border:1px solid rgba(255,255,255,.10);border-radius:22px;
  box-shadow:0 30px 100px rgba(0,0,0,.55);overflow:hidden;backdrop-filter:blur(20px)}
.top{height:58px;display:flex;align-items:center;gap:10px;padding:0 14px;border-bottom:1px solid rgba(255,255,255,.08)}
.top a,.top button{border:1px solid rgba(255,255,255,.10);background:#111;color:#fff;border-radius:10px;padding:8px 12px;text-decoration:none;cursor:pointer}
.title{font-size:13px;color:#aaa;margin-left:auto;margin-right:auto}
.frame{flex:1;min-height:0;background:#000;display:flex;align-items:center;justify-content:center}
iframe{width:100%;height:100%;border:0}
.note{padding:8px 14px;color:#666;font-size:11px;text-align:center;border-top:1px solid rgba(255,255,255,.06)}
</style>
</head>
<body>
<div class="card">
  <div class="top">
    <a href="/">← Lunar</a>
    <div class="title">TikTok video</div>
  </div>
  <div class="frame">
    <iframe
      src="https://www.tiktok.com/player/v1/${id}?controls=1&description=1&music_info=1&fullscreen_button=1"
      allow="fullscreen; autoplay"
      allowfullscreen
      loading="eager"
      title="TikTok video"></iframe>
  </div>
  <div class="note">Powered by TikTok's official embedded player.</div>
</div>
</body>
</html>`);
});

// ─── CATEGORY PAGES ─────────────────────────────────────────────────
app.get("/page/", (c) => {
const page = c.req.param("page");
const go = (url: string) => window.location.href='/view?url='+encodeURIComponent('${url}');
const embed = (path: string) => window.location.href='${path}';

let content = "";
if (page === "games") {
content =       <div style="padding: 40px; text-align: center;">
        <h1>Games Hub</h1>
        <p style="color: #888; margin-bottom: 30px;">Play online games directly in your browser</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; max-width: 900px; margin: 0 auto;">
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.chess.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">♟️</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Chess.com</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Play chess online</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.miniclip.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">🎯</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Miniclip</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Casual games</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.coolmathgames.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">🧮</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Cool Math Games</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Math & puzzle games</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.pogo.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">🃏</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Pogo</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Card & board games</p>
          </div>
        </div>
      </div>
   ;
} else if (page === "media") {
content =       <div style="padding: 40px; text-align: center;">
        <h1>Media Library</h1>
        <p style="color: #888; margin-bottom: 30px;">Watch movies, TV shows, and listen to music</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; max-width: 900px; margin: 0 auto;">
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${embed('/embed/youtube')}">
            <div style="font-size: 48px; margin-bottom: 10px;">▶️</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">YouTube</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Videos & streaming</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.netflix.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">🎬</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Netflix</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Movies & TV shows</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://open.spotify.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">🎵</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Spotify</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Music streaming</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://x.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">𝕏</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Twitter/X</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Social media</p>
          </div>
        </div>
      </div>
   ;
} else if (page === "chat") {
content =       <div style="padding: 20px; height: 100%; display: flex; flex-direction: column;">
        <h1 style="margin-top: 0; margin-bottom: 20px;">Chat Room</h1>
        <div style="flex: 1; background: #111; border: 1px solid #222; border-radius: 12px; padding: 16px; overflow-y: auto; margin-bottom: 16px;" id="chatMessages">
          <div style="color: #555; text-align: center; padding: 20px;">
            Welcome to Lunar Chat! Type a message below.
          </div>
        </div>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="chatInput" placeholder="Type your message..." style="flex: 1; padding: 10px; background: #111; border: 1px solid #222; border-radius: 8px; color: #fff; outline: none;">
          <button onclick="sendMessage()" style="padding: 10px 20px; background: #fff; color: #000; border: none; border-radius: 8px; cursor: pointer; font-weight: 500;">Send</button>
        </div>
      </div>
      <script>
        const messages = [];
        function sendMessage() {
          const input = document.getElementById('chatInput');
          const msg = input.value.trim();
          if (!msg) return;
          const now = new Date();
          const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          messages.push({ username: 'You', text: msg, time });
          renderMessages();
          input.value = '';
        }
        function renderMessages() {
          const container = document.getElementById('chatMessages');
          container.innerHTML = messages.map(m => '<div style="margin-bottom: 12px; padding: 8px; background: #000; border-radius: 4px;"><div style="font-weight: 500; color: #fff; font-size: 12px;">&lt;' + m.username + '&gt; <span style="color: #555;">' + m.time + '</span></div><div style="color: #fff; margin-top: 4px;">' + m.text + '</div></div>').join('');
          container.scrollTop = container.scrollHeight;
        }
        document.getElementById('chatInput').addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });
      </script>
   ;
} else if (page === "emulator") {
content =       <div style="padding: 40px; text-align: center;">
        <h1>Emulator</h1>
        <p style="color: #888; margin-bottom: 30px;">Play retro games with online emulators</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; max-width: 800px; margin: 0 auto;">
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.emulatoronline.com')}">
            <div style="font-size: 40px;">🎮</div>
            <h3 style="margin: 8px 0 0; color: #fff; font-size: 14px;">Emulator Online</h3>
            <p style="margin: 2px 0 0; color: #888; font-size: 11px;">NES, SNES, Genesis</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.retrogames.cz')}">
            <div style="font-size: 40px;">👾</div>
            <h3 style="margin: 8px 0 0; color: #fff; font-size: 14px;">Retro Games</h3>
            <p style="margin: 2px 0 0; color: #888; font-size: 11px;">Classic arcade games</p>
          </div>
        </div>
      </div>
   ;
} else if (page === "ai") {
content =       <div style="padding: 40px; text-align: center;">
        <h1>AI Assistant</h1>
        <p style="color: #888; margin-bottom: 30px;">Access powerful AI tools online</p>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; max-width: 900px; margin: 0 auto;">
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://chat.openai.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">🤖</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">ChatGPT</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">AI conversation</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://gemini.google.com')}">
            <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Google Gemini</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Google's AI assistant</p>
          </div>
          <div style="background: #111; border: 1px solid #222; border-radius: 12px; padding: 20px; cursor: pointer; display: flex; flex-direction: column; align-items: center;" onclick="${go('https://www.bing.com/chat')}">
            <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
            <h3 style="margin: 0; color: #fff; font-size: 16px;">Bing Chat</h3>
            <p style="margin: 4px 0 0; color: #888; font-size: 12px;">Web-powered AI</p>
          </div>
        </div>
      </div>
   ;
}

const html = `<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lunar Proxy</title>
${LUNAR_CHROME}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
:root {
  --bg: #000;
  --surface: rgba(16,16,16,.88);
  --surface-hover: rgba(28,28,28,.96);
  --border: rgba(255,255,255,.10);
  --muted: #888;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: #000;
  color: #fff;
  height: 100vh;
  overflow: hidden;
  display: flex;
}
#sidebar {
  width: 220px;
  height: 100vh;
  flex-shrink: 0;
  background: rgba(10,10,10,.94);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 18px 12px;
  z-index: 10;
}
.brand {
  padding: 8px 12px 24px;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -.4px;
}
.brand-sub {
  color: #666;
  font-size: 10px;
  font-weight: 500;
  margin-top: 3px;
}
.side-label {
  color: #555;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1.2px;
  padding: 0 12px 8px;
}
.side-nav {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.side-btn {
  width: 100%;
  border: 1px solid transparent;
  background: transparent;
  color: #aaa;
  text-align: left;
  padding: 11px 12px;
  border-radius: 9px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  transition: .18s ease;
}
.side-btn:hover {
  color: #fff;
  background: var(--surface-hover);
  border-color: var(--border);
}
.side-btn.active {
  color: #fff;
  background: rgba(255,255,255,.09);
  border-color: rgba(255,255,255,.16);
}
.side-bottom {
  margin-top: auto;
}
.home-side {
  color: #fff;
  border-color: var(--border);
  background: var(--surface);
}
#main {
  min-width: 0;
  flex: 1;
  height: 100vh;
  position: relative;
}
#topbar {
  height: 52px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-bottom: 1px solid var(--border);
  background: rgba(5,5,5,.72);
  backdrop-filter: blur(12px);
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 5;
}
.page-title {
  font-size: 13px;
  color: #aaa;
}
#content {
  padding: 72px 24px 24px;
  overflow-y: auto;
  height: 100%;
}
@media (max-width: 650px) {
  #sidebar { width: 70px; padding: 12px 8px; }
  .brand { font-size: 0; text-align: center; padding: 10px 4px 20px; }
  .brand::before { content: "L"; font-size: 20px; }
  .brand-sub, .side-label { display: none; }
  .side-btn { text-align: center; font-size: 0; padding: 12px 5px; }
  .side-btn::first-letter { font-size: 13px; }
  #content { padding-left: 16px; padding-right: 16px; }
}
</style>
</head>
<body>
<aside id="sidebar">
  <div class="brand">Lunar<div class="brand-sub">Proxy</div></div>
  <div class="side-label">NAVIGATION</div>
  <nav class="side-nav">
    <button class="side-btn ${page === "home" ? "active" : ""}" onclick="window.location.href='/'">Home</button>
    <button class="side-btn ${page === "games" ? "active" : ""}" onclick="window.location.href='/page/games'">Games</button>
    <button class="side-btn ${page === "media" ? "active" : ""}" onclick="window.location.href='/page/media'">Media</button>
    <button class="side-btn ${page === "chat" ? "active" : ""}" onclick="window.location.href='/page/chat'">Chat</button>
    <button class="side-btn ${page === "emulator" ? "active" : ""}" onclick="window.location.href='/page/emulator'">Emulator</button>
    <button class="side-btn ${page === "ai" ? "active" : ""}" onclick="window.location.href='/page/ai'">AI</button>
  </nav>
  <div class="side-bottom">
    <button class="side-btn home-side" onclick="window.location.href='/'">Back to Home</button>
  </div>
</aside>

<main id="main">
  <div id="topbar"><div class="page-title">Lunar Proxy / ${page.charAt(0).toUpperCase() + page.slice(1)}</div></div>
  <div id="content">${content}</div>
</main>
</body>
</html>`;

return c.html(html);
});

// ─── HOME PAGE ──────────────────────────────────────────────────────
app.get("/", (c) => {
return c.html(`<!DOCTYPE html>

<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Lunar Proxy</title>
${LUNAR_CHROME}
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }

 {
--bg: #000;
--surface: rgba(17, 17, 17, 0.78);
--surface-hover: rgba(28, 28, 28, 0.92);
--border: rgba(255,255,255,0.10);
--border-hover: rgba(255,255,255,0.24);
--text: #fff;
--text-secondary: #888;
--text-muted: #555;
}

html, body {
width: 100%;
min-height: 100%;
}

body {
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
background: #000;
color: var(--text);
overflow-x: hidden;
}

#space {
position: fixed;
inset: 0;
width: 100%;
height: 100%;
z-index: 0;
pointer-events: none;
display: block;
}

#gravityGlow {
position: fixed;
width: 280px;
height: 280px;
left: 0;
top: 0;
transform: translate(-50%, -50%);
border-radius: 50%;
pointer-events: none;
z-index: 1;
opacity: 0;
background: radial-gradient(
circle,
rgba(255,255,255,0.08) 0%,
rgba(255,255,255,0.025) 28%,
rgba(255,255,255,0.008) 48%,
transparent 72%
);
transition: opacity 0.25s ease;
mix-blend-mode: screen;
}

.container {
position: relative;
z-index: 2;
max-width: 900px;
min-height: 100vh;
margin: 0 auto;
padding: 70px 20px 60px;
text-align: center;
}

h1 {
font-size: clamp(40px, 6vw, 58px);
letter-spacing: -2px;
margin-bottom: 12px;
font-weight: 700;
}

.subtitle {
color: var(--text-secondary);
margin-bottom: 34px;
font-size: 14px;
}

.search-section {
margin: 35px 0 25px;
}

.search-wrap {
display: flex;
gap: 8px;
margin: 20px auto;
max-width: 620px;
}

.search-wrap input {
flex: 1;
min-width: 0;
padding: 15px 17px;
background: rgba(10,10,10,0.88);
border: 1px solid var(--border);
border-radius: 13px;
color: var(--text);
font-size: 15px;
outline: none;
transition: border-color .18s, box-shadow .18s, background .18s;
}

.search-wrap input {
border-color: rgba(255,255,255,0.28);
background: rgba(15,15,15,0.95);
box-shadow: 0 0 0 4px rgba(255,255,255,0.025);
}

.search-wrap button {
padding: 14px 24px;
background: #fff;
color: #000;
border: none;
border-radius: 13px;
cursor: pointer;
font-weight: 600;
font-size: 14px;
transition: transform .18s, opacity .18s;
}

.search-wrap button {
transform: translateY(-1px);
opacity: .9;
}

.section-label {
color: var(--text-muted);
margin-bottom: 13px;
font-size: 11px;
font-weight: 600;
letter-spacing: 1.4px;
}

.engines {
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 12px;
max-width: 620px;
margin: 18px auto 35px;
}

.engine-card {
position: relative;
background: var(--surface);
border: 1px solid var(--border);
border-radius: 14px;
padding: 17px;
cursor: pointer;
transition: transform .18s, border-color .18s, background .18s, box-shadow .18s;
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
}

.engine-card {
transform: translateY(-2px);
border-color: var(--border-hover);
background: var(--surface-hover);
}

.engine-card.active {
border-color: rgba(255,255,255,0.55);
background: rgba(255,255,255,0.96);
color: #000;
box-shadow: 0 8px 30px rgba(0,0,0,.35);
}

.engine-card img {
width: 42px;
height: 42px;
object-fit: contain;
border-radius: 9px;
display: block;
margin: 0 auto 9px;
}

.engine-name {
font-size: 12px;
font-weight: 600;
}

.shortcuts {
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 12px;
max-width: 800px;
margin: 18px auto 0;
}

.shortcut {
background: var(--surface);
border: 1px solid var(--border);
border-radius: 14px;
padding: 18px 12px;
cursor: pointer;
transition: transform .18s, border-color .18s, background .18s;
display: flex;
flex-direction: column;
align-items: center;
gap: 9px;
min-height: 100px;
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
}

.shortcut {
transform: translateY(-3px);
border-color: var(--border-hover);
background: var(--surface-hover);
}

.shortcut-icon {
width: 42px;
height: 42px;
border-radius: 10px;
object-fit: contain;
display: block;
}

.shortcut-label {
font-size: 12px;
color: var(--text-secondary);
}

.nav-buttons {
display: flex;
justify-content: center;
gap: 10px;
margin-top: 32px;
flex-wrap: wrap;
}

.nav-btn {
background: var(--surface);
border: 1px solid var(--border);
color: var(--text);
padding: 10px 18px;
border-radius: 10px;
cursor: pointer;
font-weight: 500;
transition: transform .18s, background .18s, border-color .18s;
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
}

.nav-btn {
transform: translateY(-2px);
background: var(--surface-hover);
border-color: var(--border-hover);
}

@media (max-width: 700px) {
.container { padding-top: 45px; }
.shortcuts { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 460px) {
.search-wrap { flex-direction: column; }
.engines { grid-template-columns: 1fr; }
}
</style>

</head>
<body class="lunar-home">${HOME_SIDEBAR}

<canvas id="space"></canvas>

<div id="gravityGlow"></div>

<div class="container">
  <h1>Lunar Proxy</h1>
  <p class="subtitle">Search and explore the web securely</p>

  <div class="search-section">
    <div class="search-wrap">
      <input type="text" id="searchInput" placeholder="Search or enter URL..." autocomplete="off" spellcheck="false">
      <button type="button" onclick="search()">Search</button>
    </div>
  </div>

  <div style="margin: 30px 0;">
    <p class="section-label">SELECT SEARCH ENGINE</p>

<div class="engines">
  <div class="engine-card" data-engine="bing" onclick="setEngine('bing', this)">
    <img src="https://www.google.com/s2/favicons?sz=128&domain=bing.com" alt="Bing">
    <div class="engine-name">Bing</div>
  </div>

  <div class="engine-card active" data-engine="duckduckgo" onclick="setEngine('duckduckgo', this)">
    <img src="https://www.google.com/s2/favicons?sz=128&domain=duckduckgo.com" alt="DuckDuckGo">
    <div class="engine-name">DuckDuckGo</div>
  </div>

  <div class="engine-card" data-engine="google" onclick="setEngine('google', this)">
    <img src="https://www.google.com/s2/favicons?sz=128&domain=google.com" alt="Google">
    <div class="engine-name">Google</div>
  </div>
</div>

  </div>

  <div style="margin-top: 34px;">
    <p class="section-label">QUICK SHORTCUTS</p>

<div class="shortcuts">
  <div class="shortcut" onclick="loadEmbed('/embed/youtube')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=youtube.com" alt="YouTube">
    <div class="shortcut-label">YouTube</div>
  </div>

  <div class="shortcut" onclick="loadViewer('https://reddit.com')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=reddit.com" alt="Reddit">
    <div class="shortcut-label">Reddit</div>
  </div>

  <div class="shortcut" onclick="loadViewer('https://x.com')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=x.com" alt="X">
    <div class="shortcut-label">Twitter/X</div>
  </div>

  <div class="shortcut" onclick="loadViewer('https://www.tiktok.com/discover')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=tiktok.com" alt="TikTok">
    <div class="shortcut-label">TikTok</div>
  </div>

  <div class="shortcut" onclick="loadViewer('https://instagram.com')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=instagram.com" alt="Instagram">
    <div class="shortcut-label">Instagram</div>
  </div>

  <div class="shortcut" onclick="loadViewer('https://open.spotify.com')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=spotify.com" alt="Spotify">
    <div class="shortcut-label">Spotify</div>
  </div>

  <div class="shortcut" onclick="loadViewer('https://www.netflix.com')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=netflix.com" alt="Netflix">
    <div class="shortcut-label">Netflix</div>
  </div>

  <div class="shortcut" onclick="loadViewer('https://www.chess.com')">
    <img class="shortcut-icon" src="https://www.google.com/s2/favicons?sz=128&domain=chess.com" alt="Chess">
    <div class="shortcut-label">Chess</div>
  </div>
</div>

  </div>

  <div class="nav-buttons">
    <button class="nav-btn" onclick="goToPage('games')">Games</button>
    <button class="nav-btn" onclick="goToPage('media')">Media</button>
    <button class="nav-btn" onclick="goToPage('chat')">Chat</button>
    <button class="nav-btn" onclick="goToPage('emulator')">Emulator</button>
    <button class="nav-btn" onclick="goToPage('ai')">AI</button>
  </div>
</div>

<script>
let activeEngine = 'duckduckgo';

const engines = {
  bing: 'https://www.bing.com/search?q=',
  duckduckgo: 'https://html.duckduckgo.com/html/?q=',
  google: 'https://www.google.com/search?q='
};

function setEngine(engine, element) {
  if (!engines[engine]) return;
  activeEngine = engine;
  document.querySelectorAll('.engine-card').forEach(card => {
    card.classList.remove('active');
  });
  if (element) {
    element.classList.add('active');
  }
}

function isProbablyUrl(value) {
  if (/^https?:\/\//i.test(value)) return true;
  if (value.includes(' ') || !value.includes('.') || value.length < 4) return false;
  try {
    const parsed = new URL('https://' + value);
    return !!parsed.hostname;
  } catch {
    return false;
  }
}

function search() {
  const input = document.getElementById('searchInput');
  const query = input.value.trim();
  if (!query) {
    input.focus();
    return;
  }
  let dest;
  if (isProbablyUrl(query)) {
    dest = /^https?:\/\//i.test(query) ? query : 'https://' + query;
  } else if (activeEngine === 'google') {
    dest = engines.googleLite + encodeURIComponent(query);
  } else {
    dest = engines[activeEngine] + encodeURIComponent(query);
  }
  window.location.href = '/view?url=' + encodeURIComponent(dest);
}

function loadViewer(url) {
  window.location.href = '/view?url=' + encodeURIComponent(url);
}

function loadEmbed(path) {
  window.location.href = path;
}

function goToPage(page) {
  window.location.href = '/page/' + page;
}

document.getElementById('searchInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') search();
});

const canvas = document.getElementById('space');
const ctx = canvas.getContext('2d');
const glow = document.getElementById('gravityGlow');

let width = 0;
let height = 0;
let dpr = Math.min(window.devicePixelRatio || 1, 2);

const mouse = {
  x: -1000,
  y: -1000,
  active: false
};

const PARTICLE_COUNT = 175;
const GRAVITY_RADIUS = 185;
const GRAVITY_STRENGTH = 34;
const SWIRL_STRENGTH = 18;

let particles = [];

function resizeCanvas() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    size: Math.random() * 1.45 + 0.45,
    alpha: Math.random() * 0.42 + 0.12,
    phase: Math.random() * Math.PI * 2,
    speed: Math.random() * 0.25 + 0.05
  }));
}

function drawParticles(time) {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, width, height);

  for (const p of particles) {
    let x = p.x;
    let y = p.y;

    if (mouse.active) {
      const dx = mouse.x - x;
      const dy = mouse.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < GRAVITY_RADIUS && distance > 0.5) {
        const falloff = Math.pow(1 - distance / GRAVITY_RADIUS, 2);

        const nx = dx / distance;
        const ny = dy / distance;

        x += nx * GRAVITY_STRENGTH * falloff;
        x += -ny * SWIRL_STRENGTH * falloff;
        y += nx * SWIRL_STRENGTH * falloff;
      }
    }

    y += Math.sin(time * 0.00025 * p.speed + p.phase) * 0.18;

    ctx.beginPath();
    ctx.arc(x, y, p.size, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,' + p.alpha + ')';
    ctx.fill();
  }

  requestAnimationFrame(drawParticles);
}

window.addEventListener('mousemove', (e) => {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
  mouse.active = true;

  glow.style.left = e.clientX + 'px';
  glow.style.top = e.clientY + 'px';
  glow.style.opacity = '1';
});

window.addEventListener('mouseleave', () => {
  mouse.active = false;
  glow.style.opacity = '0';
});

window.addEventListener('resize', resizeCanvas);

resizeCanvas();
requestAnimationFrame(drawParticles);
</script>

</body>
</html>`);
});

export default app;
