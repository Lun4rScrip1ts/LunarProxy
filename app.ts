import { Hono } from "hono";

const app = new Hono();

const USER_AGENT = process.env.USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/146.0.0.0 Safari/537.36";

const SEARCH_ENGINES: Record<string, string> = {
  duckduckgo: "https://html.duckduckgo.com/html/?q=",
  bing: "https://www.bing.com/search?q=",
  google: "https://www.google.com/search?q=",
};

function isSafeTarget(url: URL) {
  const host = url.hostname.toLowerCase();
  return !(
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  );
}

function absoluteUrl(value: string, base: string) {
  try {
    return new URL(value, base).href;
  } catch {
    return value;
  }
}

function proxyUrl(value: string, base: string) {
  if (!value || /^(?:#|javascript:|mailto:|tel:|data:|blob:|about:)/i.test(value)) {
    return value;
  }

  const absolute = absoluteUrl(value, base);
  if (!/^https?:\/\//i.test(absolute)) return value;
  return "/proxy?url=" + encodeURIComponent(absolute);
}

function rewriteHtml(html: string, base: string) {
  let out = html;

  // Make relative URLs resolve against the original site.
  if (!/<base\s/i.test(out)) {
    out = out.replace(/<head([^>]*)>/i, `<head$1><base href="${base.replace(/"/g, "&quot;")}">`);
  }

  out = out.replace(/\b(?:href|src|poster|action|data-src|data-original|data-lazy-src)\s*=\s*(["'])(.*?)\1/gi,
    (match, quote, value) => {
      if (/^(?:#|javascript:|mailto:|tel:|data:|blob:|about:)/i.test(value)) return match;
      return match.replace(value, proxyUrl(value, base));
    });

  out = out.replace(/\bsrcset\s*=\s*(["'])(.*?)\1/gi, (match, quote, value) => {
    const rewritten = value.split(",").map((item: string) => {
      const parts = item.trim().split(/\s+/);
      if (!parts[0]) return item;
      parts[0] = proxyUrl(parts[0], base);
      return parts.join(" ");
    }).join(", ");
    return `srcset=${quote}${rewritten}${quote}`;
  });

  out = out.replace(/url\(\s*(["']?)([^"')\s]+)\1\s*\)/gi, (match, quote, value) => {
    if (/^(?:data:|blob:|about:)/i.test(value)) return match;
    return `url("${proxyUrl(value, base)}")`;
  });

  // Keep simple navigation/forms inside Lunar.
  out = out.replace(/<script([^>]*)src\s*=\s*(["'])(.*?)\2([^>]*)>/gi,
    (match, before, quote, value, after) => `<script${before}src=${quote}${proxyUrl(value, base)}${quote}${after}>`);

  return out;
}

function upstreamHeaders(c: any, target: URL) {
  const headers = new Headers();
  headers.set("User-Agent", USER_AGENT);
  headers.set("Accept", c.req.header("accept") || "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8");
  headers.set("Accept-Language", c.req.header("accept-language") || "en-US,en;q=0.9");
  headers.set("Referer", target.origin + "/");
  headers.set("Accept-Encoding", "identity");

  const contentType = c.req.header("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  const cookie = c.req.header("cookie");
  if (cookie) headers.set("Cookie", cookie);

  return headers;
}

// Health check.
app.get("/health", (c) => c.json({ ok: true, service: "Lunar Proxy" }));

// ─── EMBEDS ──────────────────────────────────────────────────────────
app.get("/embed/youtube", (c) => c.html(`<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YouTube - Lunar</title>
<style>html,body{margin:0;height:100%;background:#000;color:#fff;font-family:system-ui}.wrap{height:100%;display:flex;flex-direction:column}.top{height:52px;display:flex;align-items:center;gap:12px;padding:0 16px;background:#111;border-bottom:1px solid #222}.top a{color:#fff;text-decoration:none}.box{flex:1;display:grid;place-items:center;padding:20px}.card{width:min(720px,100%);text-align:center}.card input{width:70%;max-width:500px;padding:12px;border-radius:8px;border:1px solid #333;background:#181818;color:#fff}.card button{padding:12px 18px;margin-left:8px;border:0;border-radius:8px;cursor:pointer}.hint{color:#888;font-size:13px}</style></head>
<body><div class="wrap"><div class="top"><a href="/">← Lunar</a><b>YouTube</b></div><div class="box"><div class="card"><h1>YouTube Player</h1><p class="hint">Paste a YouTube URL or video ID.</p><input id="yt" placeholder="https://youtube.com/watch?v=..."><button id="go">Play</button></div></div></div>
<script>
function idFrom(value){const s=value.trim(); if(/^[A-Za-z0-9_-]{6,}$/.test(s)) return s; try{const u=new URL(s); if(u.hostname.includes('youtu.be')) return u.pathname.slice(1); return u.searchParams.get('v') || (u.pathname.match(/(?:shorts|embed)\/([^/]+)/)||[])[1] || '';}catch{return ''}}
document.getElementById('go').onclick=()=>{const id=idFrom(document.getElementById('yt').value); if(!id)return alert('Enter a YouTube URL or video ID.'); location.href='/embed/youtube/watch?v='+encodeURIComponent(id)};
document.getElementById('yt').onkeydown=e=>{if(e.key==='Enter')document.getElementById('go').click()};
</script></body></html>`));

app.get("/embed/youtube/watch", (c) => {
  const id = c.req.query("v") || "";
  if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) return c.redirect("/embed/youtube");
  return c.html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>YouTube - Lunar</title><style>html,body{margin:0;height:100%;background:#000}.top{height:52px;background:#111;color:#fff;display:flex;align-items:center;padding:0 16px;font-family:system-ui}.top a{color:#fff;text-decoration:none;margin-right:16px}.frame{height:calc(100vh - 52px)}iframe{width:100%;height:100%;border:0}</style></head><body><div class="top"><a href="/embed/youtube">← Back</a><a href="/">Lunar</a></div><div class="frame"><iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div></body></html>`);
});

app.get("/embed/tiktok", (c) => {
  const id = c.req.query("v") || "";
  if (!/^\d+$/.test(id)) return c.redirect("/");
  return c.html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>TikTok - Lunar</title><style>html,body{margin:0;height:100%;background:#000;color:#fff;font-family:system-ui}.top{height:52px;background:#111;display:flex;align-items:center;padding:0 16px;gap:16px}.top a{color:#fff;text-decoration:none}.frame{height:calc(100vh - 52px);display:grid;place-items:center}.frame iframe{width:min(100%,700px);height:100%;border:0}</style></head><body><div class="top"><a href="/">← Lunar</a><b>TikTok</b></div><div class="frame"><iframe src="https://www.tiktok.com/player/v1/${id}?controls=1&description=1&music_info=1&fullscreen_button=1" allow="fullscreen; autoplay" allowfullscreen></iframe></div></body></html>`);
});

// ─── VIEWER ──────────────────────────────────────────────────────────
app.get("/view", (c) => {
  const raw = c.req.query("url") || "";
  let decoded = raw;
  try { decoded = decodeURIComponent(raw); } catch {}

  if (!decoded) return c.redirect("/");
  if (!/^https?:\/\//i.test(decoded)) decoded = "https://" + decoded;

  try {
    const target = new URL(decoded);
    const yt = target.hostname.includes("youtube.com") || target.hostname.includes("youtu.be");
    if (yt) {
      const id = target.searchParams.get("v") || (target.pathname.match(/(?:shorts|embed)\/([^/]+)/)||[])[1] || (target.hostname.includes("youtu.be") ? target.pathname.slice(1) : "");
      if (id) return c.redirect("/embed/youtube/watch?v=" + encodeURIComponent(id));
    }
    const tt = target.hostname.includes("tiktok.com");
    const m = target.pathname.match(/\/video\/(\d+)/);
    if (tt && m) return c.redirect("/embed/tiktok?v=" + encodeURIComponent(m[1]));
  } catch {}

  const safeValue = decoded.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  return c.html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lunar Viewer</title><style>*{box-sizing:border-box}html,body{margin:0;height:100%;background:#000;color:#fff;font-family:system-ui}.shell{height:100%;display:flex}.side{width:190px;flex:none;background:#0a0a0a;border-right:1px solid #222;padding:16px}.brand{font-weight:700;font-size:20px;margin:6px 8px 20px}.nav{display:block;width:100%;padding:10px;border:0;border-radius:8px;background:transparent;color:#aaa;text-align:left;cursor:pointer;margin:3px 0}.nav:hover{background:#171717;color:#fff}.main{min-width:0;flex:1;display:flex;flex-direction:column}.bar{height:56px;display:flex;gap:8px;align-items:center;padding:0 12px;background:#111;border-bottom:1px solid #222}.btn{height:34px;padding:0 12px;background:#111;color:#fff;border:1px solid #333;border-radius:8px;cursor:pointer}.url{flex:1;min-width:0;height:36px;background:#000;color:#fff;border:1px solid #333;border-radius:8px;padding:0 12px;outline:none}.frame{position:relative;flex:1}.frame iframe{width:100%;height:100%;border:0}.loading{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#888;pointer-events:none}</style></head><body><div class="shell"><aside class="side"><div class="brand">Lunar</div><button class="nav" onclick="location.href='/'">Home</button><button class="nav" onclick="location.href='/page/games'">Games</button><button class="nav" onclick="location.href='/page/media'">Media</button><button class="nav" onclick="location.href='/page/chat'">Chat</button><button class="nav" onclick="location.href='/page/emulator'">Emulator</button><button class="nav" onclick="location.href='/page/ai'">AI</button></aside><main class="main"><div class="bar"><button class="btn" onclick="history.back()">←</button><button class="btn" onclick="history.forward()">→</button><button class="btn" onclick="location.reload()">↻</button><input class="url" id="url" value="${safeValue}" autocomplete="off"><button class="btn" id="go">Go</button></div><div class="frame"><div class="loading" id="loading">Loading…</div><iframe id="viewer" sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-downloads allow-modals allow-pointer-lock allow-presentation" allow="autoplay; encrypted-media; fullscreen; picture-in-picture; geolocation; microphone; camera" src="/proxy?url=${encodeURIComponent(decoded)}"></iframe></div></main></div><script>
const input=document.getElementById('url');
function go(){const v=input.value.trim();if(!v)return;let d=/^https?:\/\//i.test(v)?v:'https://'+v;location.href='/view?url='+encodeURIComponent(d)}
document.getElementById('go').onclick=go;input.addEventListener('keydown',e=>{if(e.key==='Enter')go()});document.getElementById('viewer').addEventListener('load',()=>document.getElementById('loading').style.display='none');
</script></body></html>`);
});

// ─── PROXY ───────────────────────────────────────────────────────────
app.all("/proxy", async (c) => {
  let raw = c.req.query("url") || "";
  if (!raw) return c.json({ error: "URL required" }, 400);

  try { raw = decodeURIComponent(raw); } catch {}
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;

  let target: URL;
  try { target = new URL(raw); } catch { return c.json({ error: "Invalid URL" }, 400); }
  if (!isSafeTarget(target)) return c.json({ error: "Blocked target" }, 403);

  const method = c.req.method.toUpperCase();
  if (!["GET", "HEAD"].includes(method)) return c.json({ error: "Only GET and HEAD are supported by this simple proxy" }, 405);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(target.href, {
      method,
      headers: upstreamHeaders(c, target),
      redirect: "follow",
      signal: controller.signal,
    });

    const headers = new Headers();
    const pass = ["content-type", "content-language", "cache-control", "etag", "last-modified", "content-disposition"];
    for (const name of pass) {
      const value = response.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set("X-Lunar-Upstream", target.hostname);
    headers.delete("content-encoding");
    headers.delete("content-length");

    if (method === "HEAD") return new Response(null, { status: response.status, headers });

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("text/html") || contentType.includes("application/xhtml+xml")) {
      const text = await response.text();
      return new Response(rewriteHtml(text, target.href), { status: response.status, headers });
    }

    const buffer = await response.arrayBuffer();
    return new Response(buffer, { status: response.status, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream request failed";
    console.error("[lunar] proxy error:", target.href, message);
    return c.json({ error: "Upstream request failed", message }, 502);
  } finally {
    clearTimeout(timer);
  }
});

// ─── CATEGORY PAGES ──────────────────────────────────────────────────
function categoryCard(title: string, icon: string, description: string, url: string) {
  const encoded = encodeURIComponent(url);
  return `<button class="card" onclick="location.href='/view?url=${encoded}'"><div class="icon">${icon}</div><h3>${title}</h3><p>${description}</p></button>`;
}

app.get("/page/:page", (c) => {
  const page = c.req.param("page");
  const content: Record<string, string> = {
    games: `<h1>Games Hub</h1><p>Open a game site through Lunar.</p><div class="grid">${categoryCard("Chess.com", "♟️", "Play chess online", "https://www.chess.com")}${categoryCard("Miniclip", "🎯", "Casual games", "https://www.miniclip.com")}${categoryCard("Cool Math Games", "🧮", "Puzzle and math games", "https://www.coolmathgames.com")}</div>`,
    media: `<h1>Media</h1><p>Open media services or the built-in YouTube player.</p><div class="grid"><button class="card" onclick="location.href='/embed/youtube'"><div class="icon">▶️</div><h3>YouTube</h3><p>Use the official embedded player</p></button>${categoryCard("Spotify", "🎵", "Open Spotify", "https://open.spotify.com")}${categoryCard("Netflix", "🎬", "Open Netflix", "https://www.netflix.com")}</div>`,
    chat: `<h1>Chat</h1><p>This is a local browser-only chat demo.</p><div id="messages" class="chatbox"></div><div class="chatrow"><input id="chat" placeholder="Type a message..."><button id="send">Send</button></div>`,
    emulator: `<h1>Emulator</h1><p>Open an online emulator site.</p><div class="grid">${categoryCard("Emulator Online", "🎮", "Online emulator site", "https://www.emulatoronline.com")}${categoryCard("Retro Games", "👾", "Classic games", "https://www.retrogames.cz")}</div>`,
    ai: `<h1>AI</h1><p>Open an AI service.</p><div class="grid">${categoryCard("ChatGPT", "✦", "Open ChatGPT", "https://chatgpt.com")}${categoryCard("Claude", "◈", "Open Claude", "https://claude.ai")}</div>`,
  };

  const body = content[page] || `<h1>Page not found</h1><p>That Lunar page does not exist.</p>`;
  return c.html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lunar</title><style>*{box-sizing:border-box}html,body{margin:0;min-height:100%;background:#000;color:#fff;font-family:system-ui}.shell{min-height:100vh;display:flex}.side{width:190px;background:#0a0a0a;border-right:1px solid #222;padding:16px;flex:none}.brand{font-weight:700;font-size:20px;margin:6px 8px 20px}.nav{display:block;width:100%;padding:10px;border:0;border-radius:8px;background:transparent;color:#aaa;text-align:left;cursor:pointer;margin:3px 0}.nav:hover{background:#171717;color:#fff}.main{flex:1;padding:48px;max-width:1100px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-top:28px}.card{background:#111;color:#fff;border:1px solid #222;border-radius:14px;padding:24px;cursor:pointer;text-align:center}.card:hover{border-color:#555;transform:translateY(-2px)}.card .icon{font-size:42px}.card h3{margin:12px 0 6px}.card p,p{color:#888}.chatbox{height:400px;background:#0d0d0d;border:1px solid #222;border-radius:12px;padding:16px;overflow:auto}.chatrow{display:flex;gap:8px;margin-top:12px}.chatrow input{flex:1;background:#111;color:#fff;border:1px solid #333;border-radius:8px;padding:12px}.chatrow button{padding:0 18px;border:0;border-radius:8px;cursor:pointer}</style></head><body><div class="shell"><aside class="side"><div class="brand">Lunar</div><button class="nav" onclick="location.href='/'">Home</button><button class="nav" onclick="location.href='/page/games'">Games</button><button class="nav" onclick="location.href='/page/media'">Media</button><button class="nav" onclick="location.href='/page/chat'">Chat</button><button class="nav" onclick="location.href='/page/emulator'">Emulator</button><button class="nav" onclick="location.href='/page/ai'">AI</button></aside><main class="main">${body}</main></div><script>const send=document.getElementById('send');const chat=document.getElementById('chat');const messages=document.getElementById('messages');function add(){if(!chat||!messages)return;const v=chat.value.trim();if(!v)return;const d=document.createElement('div');d.textContent=v;d.style.cssText='padding:10px;margin-bottom:8px;background:#111;border-radius:8px';messages.appendChild(d);chat.value='';chat.focus()}if(send)send.onclick=add;if(chat)chat.addEventListener('keydown',e=>{if(e.key==='Enter')add()});</script></body></html>`);
});

// ─── HOME ────────────────────────────────────────────────────────────
app.get("/", (c) => c.html(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Lunar Proxy</title><style>*{box-sizing:border-box}html,body{margin:0;width:100%;height:100%;background:#000;color:#fff;font-family:system-ui}body{overflow:hidden}.shell{height:100%;display:flex}.side{width:190px;background:#0a0a0a;border-right:1px solid #222;padding:16px;flex:none}.brand{font-size:20px;font-weight:700;margin:6px 8px 20px}.nav{display:block;width:100%;padding:10px;border:0;border-radius:8px;background:transparent;color:#aaa;text-align:left;cursor:pointer;margin:3px 0}.nav:hover{background:#171717;color:#fff}.main{position:relative;flex:1;overflow:auto}.center{min-height:100%;display:flex;align-items:center;justify-content:center;padding:40px}.box{width:min(760px,100%);text-align:center}.logo{font-size:64px;margin-bottom:8px}.subtitle{color:#777;margin-top:0}.search{display:flex;gap:8px;margin:30px auto 18px}.search input{flex:1;min-width:0;background:#111;color:#fff;border:1px solid #333;border-radius:10px;padding:15px;outline:none;font-size:16px}.search button{background:#fff;color:#000;border:0;border-radius:10px;padding:0 22px;font-weight:600;cursor:pointer}.engines{display:flex;justify-content:center;gap:8px;flex-wrap:wrap}.engine{background:#111;color:#aaa;border:1px solid #222;border-radius:9px;padding:9px 13px;cursor:pointer}.engine.active,.engine:hover{color:#fff;border-color:#555}.shortcuts{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:24px}.shortcut{background:#0d0d0d;border:1px solid #222;border-radius:10px;padding:12px 16px;cursor:pointer;color:#ddd}.shortcut:hover{border-color:#555}.note{font-size:12px;color:#555;margin-top:30px}@media(max-width:700px){.side{width:120px}.search{flex-direction:column}.search button{height:44px}}</style></head><body><div class="shell"><aside class="side"><div class="brand">Lunar</div><button class="nav" onclick="location.href='/'">Home</button><button class="nav" onclick="location.href='/page/games'">Games</button><button class="nav" onclick="location.href='/page/media'">Media</button><button class="nav" onclick="location.href='/page/chat'">Chat</button><button class="nav" onclick="location.href='/page/emulator'">Emulator</button><button class="nav" onclick="location.href='/page/ai'">AI</button></aside><main class="main"><div class="center"><div class="box"><div class="logo">☾</div><h1>Lunar Proxy</h1><p class="subtitle">Search or enter a website address.</p><div class="search"><input id="searchInput" placeholder="Search or enter URL..." autocomplete="off" spellcheck="false"><button id="searchButton" type="button">Search</button></div><div class="engines"><button class="engine active" data-engine="duckduckgo">DuckDuckGo</button><button class="engine" data-engine="bing">Bing</button><button class="engine" data-engine="google">Google</button></div><div class="shortcuts"><button class="shortcut" data-url="https://www.youtube.com">YouTube</button><button class="shortcut" data-url="https://www.tiktok.com">TikTok</button><button class="shortcut" data-url="https://www.reddit.com">Reddit</button><button class="shortcut" data-url="https://www.instagram.com">Instagram</button></div><div class="note">Lunar uses a simple server-side web proxy. Some sites may block proxy access.</div></div></div></main></div><script>
(function(){
  let engine='duckduckgo';
  const input=document.getElementById('searchInput');
  const button=document.getElementById('searchButton');
  function isUrl(v){return /^https?:\/\//i.test(v)||(!v.includes(' ')&&v.includes('.')&&v.length>3)}
  function doSearch(){
    const value=input.value.trim();
    if(!value){input.focus();return;}
    let destination;
    if(isUrl(value)) destination=/^https?:\/\//i.test(value)?value:'https://'+value;
    else destination=(engine==='duckduckgo'?'https://html.duckduckgo.com/html/?q=':engine==='bing'?'https://www.bing.com/search?q=':'https://www.google.com/search?q=')+encodeURIComponent(value);
    window.location.assign('/view?url='+encodeURIComponent(destination));
  }
  button.addEventListener('click',doSearch);
  input.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();doSearch()}});
  document.querySelectorAll('.engine').forEach(function(el){el.addEventListener('click',function(){engine=el.dataset.engine||'duckduckgo';document.querySelectorAll('.engine').forEach(x=>x.classList.remove('active'));el.classList.add('active');input.focus()})});
  document.querySelectorAll('.shortcut').forEach(function(el){el.addEventListener('click',function(){window.location.assign('/view?url='+encodeURIComponent(el.dataset.url||''))})});
})();
</script></body></html>`));

export default app;
