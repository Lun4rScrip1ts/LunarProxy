import { Hono } from "hono";

const app = new Hono();

const USER_AGENT =
  process.env.USER_AGENT ||
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/146.0.0.0 Safari/537.36";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.7-flash";

type ChatMessage = {
  id: number;
  name: string;
  text: string;
  time: number;
};

let chatMessages: ChatMessage[] = [];
let nextChatId = 1;

const SEARCH_ENGINES: Record<string, string> = {
  duckduckgo: "https://html.duckduckgo.com/html/?q=",
  bing: "https://www.bing.com/search?q=",
  google: "https://www.google.com/search?q=",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function isSafeTarget(url: URL) {
  const host = url.hostname.toLowerCase();
  return !(
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host.endsWith(".localhost")
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
  if (
    !value ||
    /^(?:#|javascript:|mailto:|tel:|data:|blob:|about:|chrome:)/i.test(value)
  ) {
    return value;
  }

  const absolute = absoluteUrl(value, base);

  if (!/^https?:\/\//i.test(absolute)) {
    return value;
  }

  return "/proxy?url=" + encodeURIComponent(absolute);
}

function rewriteHtml(html: string, base: string) {
  let out = html;

  if (!/<base\s/i.test(out)) {
    out = out.replace(
      /<head([^>]*)>/i,
      `<head$1><base href="${escapeHtml(base)}">`
    );
  }

  const attributes = [
    "href",
    "src",
    "poster",
    "action",
    "data-src",
    "data-original",
    "data-lazy-src",
  ];

  for (const attr of attributes) {
    const regex = new RegExp(
      `\\b${attr}\\s*=\\s*(["'])(.*?)\\1`,
      "gi"
    );

    out = out.replace(regex, (match, quote, value) => {
      if (
        /^(?:#|javascript:|mailto:|tel:|data:|blob:|about:|chrome:)/i.test(
          value
        )
      ) {
        return match;
      }

      return `${attr}=${quote}${proxyUrl(value, base)}${quote}`;
    });
  }

  out = out.replace(
    /\bsrcset\s*=\s*(["'])(.*?)\1/gi,
    (match, quote, value) => {
      const rewritten = value
        .split(",")
        .map((item: string) => {
          const parts = item.trim().split(/\s+/);

          if (!parts[0]) return item;

          parts[0] = proxyUrl(parts[0], base);

          return parts.join(" ");
        })
        .join(", ");

      return `srcset=${quote}${rewritten}${quote}`;
    }
  );

  out = out.replace(
    /url\(\s*(["']?)([^"')\s]+)\1\s*\)/gi,
    (match, quote, value) => {
      if (/^(?:data:|blob:|about:)/i.test(value)) {
        return match;
      }

      return `url("${proxyUrl(value, base)}")`;
    }
  );

  return out;
}

function upstreamHeaders(c: any, target: URL) {
  const headers = new Headers();

  headers.set("User-Agent", USER_AGENT);
  headers.set(
    "Accept",
    c.req.header("accept") ||
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
  );
  headers.set(
    "Accept-Language",
    c.req.header("accept-language") || "en-US,en;q=0.9"
  );
  headers.set("Referer", target.origin + "/");
  headers.set("Accept-Encoding", "identity");

  const contentType = c.req.header("content-type");
  if (contentType) headers.set("Content-Type", contentType);

  return headers;
}

const CHROME = `
<style id="lunar-chrome">
*{box-sizing:border-box}
html,body{scrollbar-width:thin;scrollbar-color:#333 #080808}
.lunar-cursor{position:fixed;left:0;top:0;width:22px;height:22px;pointer-events:none;z-index:2147483647;opacity:0;transform:translate3d(-100px,-100px,0);transition:opacity .15s;filter:drop-shadow(0 0 7px rgba(255,255,255,.45))}
.lunar-cursor:before{content:"";position:absolute;left:2px;top:2px;width:18px;height:18px;border-radius:50%;background:#fff}
.lunar-cursor:after{content:"";position:absolute;left:8px;top:-1px;width:18px;height:18px;border-radius:50%;background:#000}
@media(pointer:coarse){.lunar-cursor{display:none!important}}
</style>
<div class="lunar-cursor" id="lunarCursor"></div>
<script>
(function(){
 if(window.__lunarCursor)return;
 window.__lunarCursor=true;
 const c=document.getElementById("lunarCursor");
 if(!c||matchMedia("(pointer:coarse)").matches)return;
 let tx=-100,ty=-100,x=-100,y=-100,started=false;
 function loop(){
   x+=(tx-x)*.25;y+=(ty-y)*.25;
   c.style.transform="translate3d("+(x-11)+"px,"+(y-11)+"px,0)";
   requestAnimationFrame(loop);
 }
 addEventListener("mousemove",function(e){
   tx=e.clientX;ty=e.clientY;
   if(!started){x=tx;y=ty;started=true;c.style.opacity="1";}
 },{passive:true});
 addEventListener("mouseleave",function(){c.style.opacity="0"});
 loop();
})();
</script>`;

const SIDEBAR = `
<aside class="sidebar">
  <div class="brand"><span>☾</span> Lunar</div>
  <button class="nav" onclick="location.href='/'">⌂ <span>Home</span></button>
  <button class="nav" onclick="location.href='/page/games'">🎮 <span>Games</span></button>
  <button class="nav" onclick="location.href='/page/media'">▶ <span>Media</span></button>
  <button class="nav" onclick="location.href='/page/chat'">💬 <span>Chat</span></button>
  <button class="nav" onclick="location.href='/page/emulator'">🕹 <span>Emulator</span></button>
  <button class="nav" onclick="location.href='/page/ai'">✦ <span>AI</span></button>
</aside>`;

const BASE_STYLE = `
<style>
*{box-sizing:border-box}
html,body{margin:0;min-height:100%;background:#050505;color:#fff;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
button,input{font:inherit}
button{cursor:pointer}
body:before{content:"";position:fixed;inset:0;pointer-events:none;background-image:radial-gradient(circle at 15% 20%,rgba(255,255,255,.08) 0 1px,transparent 1px),radial-gradient(circle at 80% 70%,rgba(255,255,255,.06) 0 1px,transparent 1px);background-size:130px 130px,190px 190px;opacity:.45}
.shell{min-height:100vh;display:flex;position:relative}
.sidebar{width:205px;flex:0 0 205px;background:rgba(10,10,10,.94);border-right:1px solid #202020;padding:18px 12px;position:sticky;top:0;height:100vh;z-index:10}
.brand{font-size:21px;font-weight:750;padding:8px 12px 24px;letter-spacing:.2px}
.brand span{margin-right:7px}
.nav{display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;margin:4px 0;border:1px solid transparent;border-radius:10px;background:transparent;color:#999;text-align:left;transition:.16s}
.nav:hover{background:#161616;color:#fff;border-color:#242424;transform:translateX(2px)}
.main{flex:1;min-width:0;position:relative}
.center{min-height:100vh;display:grid;place-items:center;padding:40px}
.box{width:min(820px,100%);text-align:center}
.logo{font-size:70px;line-height:1;text-shadow:0 0 30px rgba(255,255,255,.22);animation:float 4s ease-in-out infinite}
@keyframes float{50%{transform:translateY(-7px)}}
h1{font-size:38px;margin:14px 0 8px}
.subtitle,p{color:#858585}
.search{display:flex;gap:9px;margin:30px auto 14px}
.search input{flex:1;min-width:0;height:52px;background:#101010;border:1px solid #292929;border-radius:12px;color:#fff;padding:0 16px;outline:none;transition:.15s}
.search input:focus{border-color:#555;box-shadow:0 0 0 3px rgba(255,255,255,.04)}
.search button,.primary{height:52px;border:0;border-radius:12px;background:#fff;color:#000;padding:0 22px;font-weight:700}
.engines,.shortcuts{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.engine,.shortcut{border:1px solid #242424;background:#101010;color:#999;border-radius:9px;padding:9px 13px;transition:.15s}
.engine.active,.engine:hover,.shortcut:hover{color:#fff;border-color:#555;transform:translateY(-1px)}
.note{color:#555;font-size:12px;margin-top:25px}
.page{padding:46px;max-width:1200px;margin:auto}
.page h1{font-size:34px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:15px;margin-top:26px}
.card{background:#101010;color:#fff;border:1px solid #242424;border-radius:15px;padding:25px;text-align:center;transition:.18s}
.card:hover{border-color:#555;transform:translateY(-4px);box-shadow:0 12px 35px rgba(0,0,0,.35)}
.card .icon{font-size:42px}
.card h3{margin:12px 0 6px}
.card p{font-size:13px}
.chatbox{height:58vh;min-height:300px;background:#0b0b0b;border:1px solid #242424;border-radius:14px;padding:14px;overflow:auto}
.msg{padding:10px 12px;background:#131313;border:1px solid #202020;border-radius:10px;margin-bottom:9px}
.msg b{font-size:13px}
.msg small{float:right;color:#555}
.chatrow{display:flex;gap:8px;margin-top:10px}
.chatrow input,.ai-input{flex:1;background:#101010;color:#fff;border:1px solid #292929;border-radius:10px;padding:13px;outline:none}
.chatrow button{border:0;border-radius:10px;padding:0 20px;background:#fff;color:#000;font-weight:700}
.ai-panel{background:#0b0b0b;border:1px solid #242424;border-radius:14px;padding:16px}
.ai-messages{height:55vh;min-height:320px;overflow:auto;padding:8px}
.ai-msg{max-width:85%;padding:12px 14px;border-radius:12px;margin:8px 0;white-space:pre-wrap;line-height:1.5}
.ai-user{margin-left:auto;background:#fff;color:#000}
.ai-assistant{background:#151515;border:1px solid #242424}
.ai-row{display:flex;gap:8px;margin-top:10px}
.ai-send{border:0;border-radius:10px;background:#fff;color:#000;padding:0 20px;font-weight:700}
.status{font-size:12px;color:#666;margin:8px 2px}
.topbar{height:58px;display:flex;gap:8px;align-items:center;padding:0 12px;background:#101010;border-bottom:1px solid #222}
.btn{height:35px;border:1px solid #303030;border-radius:9px;background:#111;color:#fff;padding:0 12px}
.url{height:37px;flex:1;min-width:0;background:#050505;border:1px solid #303030;color:#fff;border-radius:9px;padding:0 12px;outline:none}
.viewer{height:calc(100vh - 58px);position:relative}
.viewer iframe{width:100%;height:100%;border:0;display:block}
.loading{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);color:#777;pointer-events:none}
@media(max-width:700px){.sidebar{width:64px;flex-basis:64px;padding:10px 7px}.brand{font-size:0;text-align:center}.brand span{font-size:23px}.nav{justify-content:center;padding:11px 5px}.nav span{display:none}.page{padding:28px 18px}.center{padding:24px 14px}.search{flex-direction:column}.search button{width:100%}h1{font-size:30px}}
</style>`;

function layout(title: string, content: string, script = "") {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)} — Lunar</title>${BASE_STYLE}</head><body>
${CHROME}<div class="shell">${SIDEBAR}<main class="main">${content}</main></div>
${script}</body></html>`;
}

function categoryCard(
  title: string,
  icon: string,
  description: string,
  url: string
) {
  return `<button class="card" onclick="location.href='/view?url=${encodeURIComponent(
    url
  )}'"><div class="icon">${icon}</div><h3>${escapeHtml(
    title
  )}</h3><p>${escapeHtml(description)}</p></button>`;
}

app.get("/health", (c) =>
  c.json({ ok: true, service: "Lunar Proxy", time: Date.now() })
);

// ----------------------------- HOME -----------------------------

app.get("/", (c) => {
  const content = `
<div class="center"><div class="box">
  <div class="logo">☾</div>
  <h1>Lunar Proxy</h1>
  <p class="subtitle">Search the web or enter a website address.</p>

  <div class="search">
    <input id="searchInput" placeholder="Search or enter URL..." autocomplete="off" spellcheck="false">
    <button id="searchButton" type="button">Search</button>
  </div>

  <div class="engines">
    <button class="engine active" data-engine="duckduckgo">DuckDuckGo</button>
    <button class="engine" data-engine="bing">Bing</button>
    <button class="engine" data-engine="google">Google</button>
  </div>

  <div class="shortcuts" style="margin-top:20px">
    <button class="shortcut" data-url="https://www.youtube.com">YouTube</button>
    <button class="shortcut" data-url="https://www.tiktok.com">TikTok</button>
    <button class="shortcut" data-url="https://www.reddit.com">Reddit</button>
    <button class="shortcut" data-url="https://www.instagram.com">Instagram</button>
  </div>

  <div class="note">Some sites can block server-side proxying. Lunar cannot override a site's own access restrictions.</div>
</div></div>`;

  const script = `<script>
(function(){
  const input=document.getElementById("searchInput");
  const button=document.getElementById("searchButton");
  let engine="duckduckgo";

  function isUrl(v){
    return /^https?:\\/\\//i.test(v) ||
      (!v.includes(" ") && v.includes(".") && v.length>3);
  }

  function search(){
    const value=input.value.trim();
    if(!value){input.focus();return;}

    let destination;
    if(isUrl(value)){
      destination=/^https?:\\/\\//i.test(value)?value:"https://"+value;
    }else{
      destination=${JSON.stringify(SEARCH_ENGINES)}[engine]+encodeURIComponent(value);
    }

    location.href="/view?url="+encodeURIComponent(destination);
  }

  button.addEventListener("click",search);
  input.addEventListener("keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();search();}
  });

  document.querySelectorAll(".engine").forEach(el=>{
    el.addEventListener("click",()=>{
      engine=el.dataset.engine||"duckduckgo";
      document.querySelectorAll(".engine").forEach(x=>x.classList.remove("active"));
      el.classList.add("active");
      input.focus();
    });
  });

  document.querySelectorAll(".shortcut").forEach(el=>{
    el.addEventListener("click",()=>{
      const u=el.dataset.url;
      if(u) location.href="/view?url="+encodeURIComponent(u);
    });
  });
})();
</script>`;

  return c.html(layout("Home", content, script));
});

// ----------------------------- VIEWER -----------------------------

app.get("/view", (c) => {
  let decoded = c.req.query("url") || "";
  try {
    decoded = decodeURIComponent(decoded);
  } catch {}

  if (!decoded) return c.redirect("/");
  if (!/^https?:\/\//i.test(decoded)) decoded = "https://" + decoded;

  try {
    const target = new URL(decoded);

    if (
      target.hostname.includes("youtube.com") ||
      target.hostname.includes("youtu.be")
    ) {
      const id =
        target.searchParams.get("v") ||
        (target.pathname.match(/(?:shorts|embed)\/([^/]+)/) || [])[1] ||
        (target.hostname.includes("youtu.be")
          ? target.pathname.slice(1)
          : "");

      if (id && /^[A-Za-z0-9_-]{6,}$/.test(id)) {
        return c.redirect(
          "/embed/youtube/watch?v=" + encodeURIComponent(id)
        );
      }
    }

    if (target.hostname.includes("tiktok.com")) {
      const match = target.pathname.match(/\/video\/(\d+)/);
      if (match) {
        return c.redirect("/embed/tiktok?v=" + encodeURIComponent(match[1]));
      }
    }
  } catch {}

  const safe = escapeHtml(decoded);

  const content = `
<div class="topbar">
  <button class="btn" onclick="history.back()">←</button>
  <button class="btn" onclick="history.forward()">→</button>
  <button class="btn" onclick="reloadViewer()">↻</button>
  <input class="url" id="urlbar" value="${safe}" autocomplete="off">
  <button class="btn" onclick="go()">Go</button>
</div>
<div class="viewer">
  <div class="loading" id="loading">Loading…</div>
  <iframe id="viewerFrame"
    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation allow-downloads allow-modals allow-pointer-lock allow-presentation"
    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; geolocation; microphone; camera"
    src="/proxy?url=${encodeURIComponent(decoded)}"></iframe>
</div>`;

  const script = `<script>
const bar = document.getElementById("urlbar");
const frame = document.getElementById("viewerFrame");
const loading = document.getElementById("loading");

function go(){
  const v = bar.value.trim();
  if (!v) return;

  let dest;

  if (/^https?:\/\//i.test(v)) {
    dest = v;
  }
  else if (
    v.includes(".") &&
    !v.includes(" ") &&
    /^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/i.test(v)
  ) {
    dest = "https://" + v;
  }
  else {
    dest =
      "https://duckduckgo.com/?q=" +
      encodeURIComponent(v);
  }

  location.href = "/view?url=" + encodeURIComponent(dest);
}

function reloadViewer(){
  loading.style.display = "block";
  frame.src = frame.src;
}

bar.addEventListener("keydown", e => {
  if (e.key === "Enter") {
    e.preventDefault();
    go();
  }
});

frame.addEventListener("load", () => {
  loading.style.display = "none";
});
</script>`;

  return c.html(layout("Viewer", content, script));
});

// ----------------------------- PROXY -----------------------------

app.all("/proxy", async (c) => {
  let raw = c.req.query("url") || "";

  if (!raw) {
    return c.json({ error: "URL required" }, 400);
  }

  // Decode the URL safely.
  try {
    raw = decodeURIComponent(raw);
  } catch {}

  if (!/^https?:\/\//i.test(raw)) {
    raw = "https://" + raw;
  }

  let target: URL;

  try {
    target = new URL(raw);
  } catch {
    return c.json({ error: "Invalid URL" }, 400);
  }

  /*
   * DuckDuckGo result links often look like:
   *
   * /l/?uddg=https%3A%2F%2Fexample.com
   *
   * We don't want to proxy DuckDuckGo's redirect page.
   * We want to extract the real destination.
   */
  const isDuckDuckGo =
    target.hostname === "duckduckgo.com" ||
    target.hostname.endsWith(".duckduckgo.com");

  if (
    isDuckDuckGo &&
    (target.pathname === "/l" || target.pathname === "/l/")
  ) {
    const destination = target.searchParams.get("uddg");

    if (destination) {
      try {
        const decodedDestination = decodeURIComponent(destination);
        const destinationUrl = new URL(decodedDestination);

        if (!isSafeTarget(destinationUrl)) {
          return c.json({ error: "Blocked target" }, 403);
        }

        target = destinationUrl;
      } catch {
        return c.json(
          { error: "Invalid DuckDuckGo destination" },
          400
        );
      }
    }
  }

  // Final safety check after any URL unwrapping.
  if (!isSafeTarget(target)) {
    return c.json({ error: "Blocked target" }, 403);
  }

  const method = c.req.method.toUpperCase();

  if (!["GET", "HEAD"].includes(method)) {
    return c.json(
      {
        error: "This proxy currently supports GET and HEAD requests."
      },
      405
    );
  }

  const controller = new AbortController();

  const timer = setTimeout(() => {
    controller.abort();
  }, 25000);

  try {
    const response = await fetch(target.href, {
      method,
      headers: upstreamHeaders(c, target),
      redirect: "follow",
      signal: controller.signal,
    });

    const headers = new Headers();

    /*
     * Copy useful response headers.
     */
    for (const name of [
      "content-type",
      "content-language",
      "cache-control",
      "etag",
      "last-modified",
      "content-disposition",
    ]) {
      const value = response.headers.get(name);

      if (value) {
        headers.set(name, value);
      }
    }

    headers.set("X-Lunar-Upstream", target.hostname);

    /*
     * We're handling compression ourselves.
     */
    headers.delete("content-encoding");
    headers.delete("content-length");

    if (method === "HEAD") {
      return new Response(null, {
        status: response.status,
        headers,
      });
    }

    const contentType =
      response.headers.get("content-type") || "";

    /*
     * HTML pages need URL rewriting so that:
     *
     * images
     * CSS
     * JavaScript
     * links
     * forms
     * media
     *
     * continue going through Lunar.
     */
    if (
      contentType.includes("text/html") ||
      contentType.includes("application/xhtml+xml")
    ) {
      const text = await response.text();

      /*
       * IMPORTANT:
       * response.url may be different from target.href because
       * the upstream server may have redirected somewhere else.
       *
       * Using response.url gives rewriteHtml the correct base URL.
       */
      const baseUrl = response.url || target.href;

      const rewritten = rewriteHtml(text, baseUrl);

      headers.set("content-type", "text/html; charset=utf-8");

      return new Response(rewritten, {
        status: response.status,
        headers,
      });
    }

    /*
     * Images, CSS, JS, fonts, videos, etc.
     * are passed through without HTML rewriting.
     */
    const buffer = await response.arrayBuffer();

    return new Response(buffer, {
      status: response.status,
      headers,
    });

  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Upstream request failed";

    console.error(
      "[lunar] proxy error:",
      target.href,
      message
    );

    return c.json(
      {
        error: "Upstream request failed",
        message,
      },
      502
    );

  } finally {
    clearTimeout(timer);
  }
});
// ----------------------------- EMBEDS -----------------------------

app.get("/embed/youtube", (c) => {
  return c.html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>YouTube — Lunar</title>${BASE_STYLE}</head><body>${CHROME}
<div style="min-height:100vh;display:grid;place-items:center;padding:30px">
<div class="card" style="width:min(720px,100%)">
<h1>YouTube Player</h1>
<p>Paste a YouTube URL or video ID.</p>
<div class="search"><input id="yt" placeholder="https://youtube.com/watch?v=..."><button id="play" class="primary">Play</button></div>
</div></div>
<script>
function getId(value){
 const s=value.trim();
 if(/^[A-Za-z0-9_-]{6,}$/.test(s))return s;
 try{
  const u=new URL(s);
  if(u.hostname.includes("youtu.be"))return u.pathname.slice(1);
  return u.searchParams.get("v")||(u.pathname.match(/(?:shorts|embed)\\/([^/]+)/)||[])[1]||"";
 }catch{return "";}
}
function play(){
 const id=getId(document.getElementById("yt").value);
 if(id)location.href="/embed/youtube/watch?v="+encodeURIComponent(id);
}
document.getElementById("play").onclick=play;
document.getElementById("yt").onkeydown=e=>{if(e.key==="Enter")play()};
</script></body></html>`);
});

app.get("/embed/youtube/watch", (c) => {
  const id = c.req.query("v") || "";

  if (!/^[A-Za-z0-9_-]{6,}$/.test(id)) {
    return c.redirect("/embed/youtube");
  }

  return c.html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>YouTube — Lunar</title>${BASE_STYLE}</head><body>${CHROME}
<div class="topbar"><button class="btn" onclick="location.href='/embed/youtube'">← Back</button><button class="btn" onclick="location.href='/'">Lunar</button></div>
<div style="height:calc(100vh - 58px)"><iframe style="width:100%;height:100%;border:0" src="https://www.youtube.com/embed/${encodeURIComponent(id)}?autoplay=1" allow="autoplay; encrypted-media; fullscreen; picture-in-picture" allowfullscreen></iframe></div>
</body></html>`);
});

app.get("/embed/tiktok", (c) => {
  const id = c.req.query("v") || "";

  if (!/^\d+$/.test(id)) return c.redirect("/");

  return c.html(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>TikTok — Lunar</title>${BASE_STYLE}</head><body>${CHROME}
<div class="topbar"><button class="btn" onclick="location.href='/'">← Lunar</button><b>TikTok</b></div>
<div style="height:calc(100vh - 58px);display:grid;place-items:center"><iframe style="width:min(700px,100%);height:100%;border:0" src="https://www.tiktok.com/player/v1/${id}?controls=1&description=1&music_info=1&fullscreen_button=1" allow="fullscreen; autoplay" allowfullscreen></iframe></div>
</body></html>`);
});

// ----------------------------- SHARED CHAT -----------------------------

app.get("/api/chat", (c) => {
  return c.json({
    messages: chatMessages.slice(-100),
  });
});

app.post("/api/chat", async (c) => {
  try {
    const body = await c.req.json();
    const name =
      typeof body?.name === "string" && body.name.trim()
        ? body.name.trim().slice(0, 30)
        : "Guest";
    const text =
      typeof body?.text === "string" ? body.text.trim().slice(0, 500) : "";

    if (!text) return c.json({ error: "Message required" }, 400);

    const message: ChatMessage = {
      id: nextChatId++,
      name,
      text,
      time: Date.now(),
    };

    chatMessages.push(message);

    if (chatMessages.length > 100) {
      chatMessages = chatMessages.slice(-100);
    }

    return c.json({ ok: true, message });
  } catch {
    return c.json({ error: "Invalid request" }, 400);
  }
});

function chatPage() {
  const content = `
<div class="page">
<h1>Shared Chat</h1>
<p>Messages are stored on the Lunar server, so visitors using the same deployment can see them.</p>
<div class="chatbox" id="messages"></div>
<div class="chatrow">
<input id="name" placeholder="Your name" maxlength="30">
<input id="chatInput" placeholder="Type a message..." maxlength="500">
<button id="send">Send</button>
</div>
<div class="status" id="chatStatus">Connecting…</div>
</div>`;

  const script = `<script>
const messages=document.getElementById("messages");
const nameInput=document.getElementById("name");
const input=document.getElementById("chatInput");
const send=document.getElementById("send");
const status=document.getElementById("chatStatus");

nameInput.value=localStorage.getItem("lunarName")||"";
nameInput.addEventListener("input",()=>localStorage.setItem("lunarName",nameInput.value));

let lastSignature="";

function render(data){
 const signature=JSON.stringify(data.messages||[]);
 if(signature===lastSignature)return;
 lastSignature=signature;
 messages.innerHTML="";
 for(const m of data.messages||[]){
   const row=document.createElement("div");
   row.className="msg";
   const top=document.createElement("div");
   const b=document.createElement("b");
   b.textContent=m.name;
   const small=document.createElement("small");
   small.textContent=new Date(m.time).toLocaleTimeString();
   top.append(b,small);
   const text=document.createElement("div");
   text.style.marginTop="6px";
   text.textContent=m.text;
   row.append(top,text);
   messages.appendChild(row);
 }
 messages.scrollTop=messages.scrollHeight;
}

async function load(){
 try{
   const r=await fetch("/api/chat",{cache:"no-store"});
   if(!r.ok)throw new Error("HTTP "+r.status);
   render(await r.json());
   status.textContent="Connected";
 }catch(e){
   status.textContent="Chat connection failed";
 }
}

async function sendMessage(){
 const text=input.value.trim();
 if(!text)return;
 send.disabled=true;
 try{
   const r=await fetch("/api/chat",{
     method:"POST",
     headers:{"Content-Type":"application/json"},
     body:JSON.stringify({name:nameInput.value,text})
   });
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||"Failed");
   input.value="";
   await load();
   input.focus();
 }catch(e){
   status.textContent=e.message||"Could not send";
 }finally{
   send.disabled=false;
 }
}

send.onclick=sendMessage;
input.addEventListener("keydown",e=>{
 if(e.key==="Enter"){e.preventDefault();sendMessage();}
});
load();
setInterval(load,1500);
</script>`;

  return layout("Chat", content, script);
}

// ----------------------------- AI PAGE -----------------------------

function aiPage() {
  const content = `
<div class="page">
  <h1>✦ Lunar AI</h1>
  <p>Chat with Lunar AI powered by Google Gemini.</p>

  <div class="ai-panel">

    <div class="ai-messages" id="aiMessages">
      <div class="ai-msg ai-assistant">
        <b>Lunar AI</b>
        <div style="margin-top:8px;">
          Hey! I'm Lunar AI. What would you like to ask?
        </div>
      </div>
    </div>

    <div class="status" id="aiStatus">
      Checking Gemini connection…
    </div>

    <div class="ai-row">
      <input
        id="aiInput"
        class="ai-input"
        type="text"
        maxlength="8000"
        placeholder="Ask Lunar AI anything..."
        autocomplete="off"
        spellcheck="false"
      >

      <button id="aiSend" class="ai-send">
        Send
      </button>
    </div>

  </div>
</div>`;

  const script = `
<script>
(() => {
  const messages = document.getElementById("aiMessages");
  const input = document.getElementById("aiInput");
  const send = document.getElementById("aiSend");
  const status = document.getElementById("aiStatus");

  let history = [];

  function addMessage(role, text) {
    const message = document.createElement("div");

    message.className =
      "ai-msg " +
      (role === "user"
        ? "ai-user"
        : "ai-assistant");

    const title = document.createElement("b");

    title.textContent =
      role === "user"
        ? "You"
        : "Lunar AI";

    const body = document.createElement("div");

    body.style.marginTop = "8px";
    body.style.whiteSpace = "pre-wrap";
    body.textContent = text;

    message.appendChild(title);
    message.appendChild(body);

    messages.appendChild(message);

    messages.scrollTop = messages.scrollHeight;

    return message;
  }

  async function checkStatus() {
    try {
      const response = await fetch(
        "/api/ai/status",
        {
          cache: "no-store"
        }
      );

      if (!response.ok) {
        status.textContent =
          "AI status unavailable";
        return;
      }

      const data = await response.json();

      if (data.configured) {
        status.textContent =
          "Connected • " +
          (data.model || "Gemini");
      } else {
        status.textContent =
          "Gemini API key is not configured.";
      }

    } catch (error) {
      status.textContent =
        "Unable to connect to Lunar AI.";
    }
  }

  async function sendMessage() {
    const text = input.value.trim();

    if (!text || send.disabled) {
      return;
    }

    addMessage("user", text);

    input.value = "";

    input.disabled = true;
    send.disabled = true;

    status.textContent =
      "Lunar AI is thinking…";

    try {
      const response = await fetch(
        "/api/ai",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            input: text,
            history: history
          })
        }
      );

      const raw = await response.text();

      let data;

      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          "Server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
          "Gemini request failed."
        );
      }

      const answer =
        typeof data.text === "string"
          ? data.text
          : "Gemini returned an empty response.";

      addMessage(
        "assistant",
        answer
      );

      history.push({
        role: "user",
        content: text
      });

      history.push({
        role: "assistant",
        content: answer
      });

      if (history.length > 12) {
        history =
          history.slice(-12);
      }

      status.textContent =
        "Connected • " +
        (data.model || "Gemini");

    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "AI request failed.";

      addMessage(
        "assistant",
        "Sorry, I couldn't get a response from Gemini.\\n\\n" +
        message
      );

      status.textContent =
        "AI request failed.";

    } finally {
      input.disabled = false;
      send.disabled = false;
      input.focus();
    }
  }

  send.addEventListener(
    "click",
    sendMessage
  );

  input.addEventListener(
    "keydown",
    (event) => {
      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {
        event.preventDefault();
        sendMessage();
      }
    }
  );

  checkStatus();

  input.focus();
})();
</script>`;

  return layout(
    "AI",
    content,
    script
  );
}
// ----------------------------- OTHER PAGES -----------------------------

app.get("/page/:page", (c) => {
  const page = c.req.param("page");

  if (page === "chat") return c.html(chatPage());
  if (page === "ai") return c.html(aiPage());

  let content = "";

  if (page === "games") {
    content = `
<div class="page">
<h1>Games</h1>
<p>Game sites that can be opened through Lunar.</p>
<div class="grid">
${categoryCard("Chess.com","♟️","Play chess online","https://www.chess.com")}
${categoryCard("Miniclip","🎯","Casual games","https://www.miniclip.com")}
${categoryCard("Cool Math Games","🧮","Puzzle games","https://www.coolmathgames.com")}
${categoryCard("Pogo","🃏","Card and board games","https://www.pogo.com")}
</div></div>`;
  } else if (page === "media") {
    content = `
<div class="page">
<h1>Media</h1>
<p>Media services and built-in players.</p>
<div class="grid">
<button class="card" onclick="location.href='/embed/youtube'"><div class="icon">▶️</div><h3>YouTube Player</h3><p>Official embedded player</p></button>
${categoryCard("Spotify","🎵","Open Spotify","https://open.spotify.com")}
${categoryCard("Reddit","💬","Open Reddit","https://www.reddit.com")}
</div></div>`;
  } else if (page === "emulator") {
    content = `
<div class="page">
<h1>Emulator</h1>
<p>Online emulator resources.</p>
<div class="grid">
${categoryCard("Emulator Online","🎮","Online emulator site","https://www.emulatoronline.com")}
${categoryCard("Retro Games","👾","Classic games","https://www.retrogames.cz")}
</div></div>`;
  } else {
    content = `
<div class="page">
<h1>Page not found</h1>
<p>That Lunar page does not exist.</p>
<button class="primary" onclick="location.href='/'">Return Home</button>
</div>`;
  }

  return c.html(layout(page, content));
});

export default app;
