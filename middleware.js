/**
 * Vercel Routing Middleware: Telegram alerts for CV downloads and portfolio visits.
 *
 * Put this file in the ROOT of your Vercel project (the folder set as
 * "Root Directory" in Vercel > Settings > General), next to package.json.
 *
 * Environment variables (Vercel > Settings > Environment Variables):
 *   TELEGRAM_BOT_TOKEN   token from @BotFather
 *   TELEGRAM_CHAT_ID     your chat id
 *   NOTIFY_VISITS        "true" (default) or "false" for CV alerts only
 *   IGNORE_IPS           optional, your own IP(s), comma separated
 *
 * It never blocks or changes the response. The alert is sent in the background.
 */

export const config = {
  // Skip static files (css, js, images, fonts), except anything under /assets/cv/.
  matcher: [
    "/assets/cv/:path*",
    "/((?!assets/|favicon|robots.txt|sitemap.xml|.*\\.(?:css|js|png|jpg|jpeg|svg|webp|ico|woff2?|map|json|xml|txt)$).*)",
  ],
};

const CV_DEDUPE_MS = 10 * 60 * 1000;    // 10 min
const VISIT_DEDUPE_MS = 30 * 60 * 1000; // 30 min
const seen = new Map(); // best-effort dedupe (per edge instance)

const BOT_UA = new RegExp(
  [
    "bot", "crawl", "spider", "slurp", "preview", "fetch", "scan", "monitor",
    "curl", "wget", "python-requests", "httpclient", "go-http", "axios", "node-fetch",
    "facebookexternalhit", "linkedinbot", "whatsapp", "telegrambot", "slackbot",
    "discordbot", "twitterbot", "skypeuripreview", "embedly", "headless",
    "lighthouse", "uptime", "pingdom", "vercel",
  ].join("|"),
  "i"
);

export default function middleware(request, context) {
  try {
    const kind = classify(request);
    if (kind) {
      const task = notify(kind, request).catch((e) => console.error("notify:", e));
      if (context && typeof context.waitUntil === "function") context.waitUntil(task);
    }
  } catch (e) {
    console.error("middleware:", e);
  }
  // Returning nothing lets the request continue to your site as normal.
}

function getIp(request) {
  const xff = request.headers.get("x-forwarded-for") || "";
  return request.headers.get("x-real-ip") || xff.split(",")[0].trim() || "unknown";
}

function classify(request) {
  if (request.method !== "GET") return null;

  const ua = request.headers.get("user-agent") || "";
  if (!ua || BOT_UA.test(ua)) return null;

  const purpose = request.headers.get("sec-purpose") || request.headers.get("purpose") || "";
  if (/prefetch|prerender/i.test(purpose)) return null;

  const ip = getIp(request);
  const ignore = (process.env.IGNORE_IPS || "").split(",").map((s) => s.trim()).filter(Boolean);
  if (ignore.includes(ip)) return null;

  const path = new URL(request.url).pathname;

  if (path.startsWith("/assets/cv/")) {
    // PDF viewers download in chunks. Count only the first one.
    const range = request.headers.get("range");
    if (range && !/^bytes=0-/.test(range)) return null;
    return dedupe(`${ip}|cv|${path}`, CV_DEDUPE_MS) ? "cv" : null;
  }

  if ((process.env.NOTIFY_VISITS || "true") !== "true") return null;
  if (/^\/admin(\.html)?\/?$/.test(path)) return null;
  // Only real page loads (the browser asks for HTML).
  if (!(request.headers.get("accept") || "").includes("text/html")) return null;

  return dedupe(`${ip}|visit`, VISIT_DEDUPE_MS) ? "visit" : null;
}

function dedupe(key, ttl) {
  const now = Date.now();
  const last = seen.get(key);
  if (last && now - last < ttl) return false;
  seen.set(key, now);
  if (seen.size > 5000) seen.clear();
  return true;
}

async function notify(kind, request) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    console.error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID not set");
    return;
  }

  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildMessage(kind, request),
      parse_mode: "HTML",
      disable_web_page_preview: true,
      disable_notification: kind === "visit", // visits silent, CV with sound
    }),
  });
  if (!res.ok) console.error("Telegram error", res.status, await res.text());
}

function buildMessage(kind, request) {
  const h = request.headers;
  const url = new URL(request.url);
  const dec = (v) => { try { return decodeURIComponent(v || ""); } catch { return v || ""; } };

  const location =
    [dec(h.get("x-vercel-ip-city")), h.get("x-vercel-ip-country-region"), h.get("x-vercel-ip-country")]
      .filter(Boolean).join(", ") || "unknown";
  const referer = h.get("referer") || "direct / unknown";
  const time = new Date().toLocaleString("en-GB", {
    timeZone: "Asia/Kathmandu", dateStyle: "medium", timeStyle: "short",
  });

  const head = kind === "cv"
    ? ["📄 <b>Someone downloaded your CV</b>", "", `<b>File:</b> ${esc(dec(url.pathname.split("/").pop()))}`]
    : ["👀 <b>Someone opened your portfolio</b>", "", `<b>Page:</b> ${esc(dec(url.pathname))}`];

  return [
    ...head,
    `<b>Time:</b> ${esc(time)} (NPT)`,
    `<b>Location:</b> ${esc(location)}`,
    `<b>Device:</b> ${esc(describeUA(h.get("user-agent") || ""))}`,
    `<b>From:</b> ${esc(referer)}`,
    `<b>IP:</b> <code>${esc(getIp(request))}</code>`,
  ].join("\n");
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
  return `${browser} on ${os}${/Mobile|Android|iPhone/i.test(ua) ? " (mobile)" : ""}`;
}

function esc(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
