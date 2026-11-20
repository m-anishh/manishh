/**
 * Vercel Routing Middleware — Telegram alerts for CV downloads & portfolio visits.
 *
 * Runs before Vercel serves a file. It never changes the response: it only
 * sends a Telegram message in the background (context.waitUntil) and lets the
 * request continue as normal.
 *
 *  📄 CV download  → any request under /assets/cv/   (plays a sound)
 *  👀 Page visit   → a browser page load (HTML)       (silent)
 *
 * Environment variables (Vercel → Project → Settings → Environment Variables):
 *   TELEGRAM_BOT_TOKEN   token from @BotFather              (required)
 *   TELEGRAM_CHAT_ID     your chat id                       (required)
 *   NOTIFY_VISITS        "false" to turn off visit alerts   (optional, default on)
 *   IGNORE_IPS           your own IP(s), comma separated    (optional)
 *
 * If the token or chat id is missing, the middleware does nothing.
 */

export const config = {
  // Skip static files (css, js, images, fonts...) except CV PDFs.
  matcher: ["/((?!assets/(?!cv/)|content/|favicon|robots\\.txt|sitemap\\.xml).*)"],
};

const CV_DEDUPE_MS = 10 * 60 * 1000;    // same IP + file: once per 10 min
const VISIT_DEDUPE_MS = 30 * 60 * 1000; // same IP visiting: once per 30 min

const BOT_UA = new RegExp(
  [
    "bot", "crawl", "spider", "slurp", "preview", "fetch", "scan", "monitor",
    "curl", "wget", "python-requests", "httpclient", "go-http", "axios", "node-fetch",
    "facebookexternalhit", "linkedinbot", "whatsapp", "telegrambot", "slackbot",
    "discordbot", "twitterbot", "skypeuripreview", "embedly", "headless", "lighthouse",
    "uptime", "pingdom", "vercel",
  ].join("|"),
  "i"
);

// Best-effort dedupe. It lives in memory, so it resets when Vercel starts a new
// instance. You may occasionally get a duplicate alert.
const seen = new Map();

export default function middleware(request, context) {
  try {
    const kind = classify(request);
    if (kind) {
      const job = notify(kind, request).catch((err) =>
        console.error("telegram-notify:", err)
      );
      if (context && typeof context.waitUntil === "function") context.waitUntil(job);
    }
  } catch (err) {
    console.error("telegram-notify: filter error", err);
  }
  // Returning nothing = continue to the normal file. The site is never affected.
}

/** Returns "cv", "visit", or null. */
function classify(request) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return null;
  if (request.method !== "GET") return null;

  const h = request.headers;
  const ua = h.get("user-agent") || "";
  if (!ua || BOT_UA.test(ua)) return null;

  const ip = getIp(request);
  const ignore = String(process.env.IGNORE_IPS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);
  if (ignore.includes(ip)) return null;

  const path = new URL(request.url).pathname;

  if (path.startsWith("/assets/cv/")) {
    if (!/\.pdf$/i.test(path)) return null;
    // PDF viewers download in chunks: only count the first one.
    const range = h.get("range");
    if (range && !/^bytes=0-/.test(range)) return null;
    return isNew(`${ip}|cv|${path}`, CV_DEDUPE_MS) ? "cv" : null;
  }

  if (String(process.env.NOTIFY_VISITS).toLowerCase() === "false") return null;

  // Real page loads only: the browser asks for a document, not a prefetch.
  const dest = h.get("sec-fetch-dest");
  const accept = h.get("accept") || "";
  const isPage = dest ? dest === "document" : accept.includes("text/html");
  if (!isPage) return null;
  const purpose = h.get("sec-purpose") || h.get("purpose") || "";
  if (/prefetch|prerender/i.test(purpose)) return null;
  // Skip the private admin page.
  if (/^\/admin(\.html)?\/?$/.test(path)) return null;

  return isNew(`${ip}|visit`, VISIT_DEDUPE_MS) ? "visit" : null;
}

function isNew(key, ttl) {
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < ttl) return false;
  seen.set(key, now);
  if (seen.size > 1000) {
    for (const [k, t] of seen) if (now - t > VISIT_DEDUPE_MS) seen.delete(k);
  }
  return true;
}

async function notify(kind, request) {
  const res = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: buildMessage(kind, request),
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: kind === "visit", // visits arrive silently
      }),
    }
  );
  if (!res.ok) console.error("telegram-notify: Telegram error", res.status, await res.text());
}

function buildMessage(kind, request) {
  const h = request.headers;
  const url = new URL(request.url);
  const ua = h.get("user-agent") || "";
  const referer = h.get("referer") || "direct / unknown";

  const location =
    [h.get("x-vercel-ip-city"), h.get("x-vercel-ip-country-region"), h.get("x-vercel-ip-country")]
      .filter(Boolean)
      .map(safeDecode)
      .join(", ") || "unknown";

  const time = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const path = safeDecode(url.pathname);
  const head =
    kind === "cv"
      ? ["📄 <b>Someone downloaded your CV</b>", "", `<b>File:</b> ${esc(path.split("/").pop())}`]
      : ["👀 <b>Someone opened your portfolio</b>", "", `<b>Page:</b> ${esc(path)}`];

  return [
    ...head,
    `<b>Time:</b> ${esc(time)} (NPT)`,
    `<b>Location:</b> ${esc(location)}`,
    `<b>Device:</b> ${esc(describeUA(ua))}`,
    `<b>From:</b> ${esc(referer)}`,
    `<b>IP:</b> <code>${esc(getIp(request))}</code>`,
  ].join("\n");
}

function getIp(request) {
  const h = request.headers;
  return (
    h.get("x-real-ip") ||
    (h.get("x-forwarded-for") || "").split(",")[0].trim() ||
    "unknown"
  );
}

function describeUA(ua) {
  const os =
    /Windows/i.test(ua) ? "Windows" :
    /iPhone|iPad/i.test(ua) ? "iOS" :
    /Android/i.test(ua) ? "Android" :
    /Mac OS X/i.test(ua) ? "macOS" :
    /Linux/i.test(ua) ? "Linux" : "Unknown OS";
  const browser =
    /Edg\//i.test(ua) ? "Edge" :
    /OPR\//i.test(ua) ? "Opera" :
    /Chrome\//i.test(ua) ? "Chrome" :
    /Firefox\//i.test(ua) ? "Firefox" :
    /Safari\//i.test(ua) ? "Safari" : "Unknown browser";
  const mobile = /Mobile|Android|iPhone/i.test(ua) ? " (mobile)" : "";
  return `${browser} on ${os}${mobile}`;
}

function safeDecode(s) {
  try { return decodeURIComponent(s); } catch { return s; }
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
