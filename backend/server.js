const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const rateLimit = require("express-rate-limit");

const app = express();
const PORT = process.env.PORT || 5001;
const TEMP_DIR = path.join(__dirname, "temp");
const MAX_CONCURRENT_REQUESTS = 4;
let activeExternalRequests = 0;
const pendingRequests = [];

// Make sure the temp folder exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173,https://tiktok-dowloader-seven.vercel.app")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "2mb" }));

const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many download requests at once. Please wait a moment and try again."
  }
});

app.use("/api/download", downloadLimiter);

function enqueueExternalRequest(task) {
  return new Promise((resolve, reject) => {
    pendingRequests.push({ task, resolve, reject });
    drainExternalQueue();
  });
}

function drainExternalQueue() {
  if (activeExternalRequests >= MAX_CONCURRENT_REQUESTS || pendingRequests.length === 0) {
    return;
  }

  const next = pendingRequests.shift();
  activeExternalRequests += 1;

  Promise.resolve()
    .then(next.task)
    .then(next.resolve)
    .catch(next.reject)
    .finally(() => {
      activeExternalRequests -= 1;
      drainExternalQueue();
    });
}

/**
 * Very simple TikTok URL validator.
 * Accepts things like:
 *  - https://www.tiktok.com/@user/video/1234567890123456789
 *  - https://vm.tiktok.com/XXXXXXX/
 *  - https://vt.tiktok.com/XXXXXXX/
 *  - https://m.tiktok.com/v/1234567890123456789.html
 */
function isTikTokUrl(url) {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "tiktok.com" ||
      host.endsWith(".tiktok.com")
    );
  } catch {
    return false;
  }
}

/**
 * Ask the public TikWM resolver API for the direct, no-watermark
 * MP4 URL for a given TikTok share link.
 * (This is the same kind of public endpoint many open-source
 * TikTok downloader tools use — no login/cookies required.)
 */
async function resolveVideoUrl(tiktokUrl) {
  const apiUrl = "https://www.tikwm.com/api/";
  const response = await axios.get(apiUrl, {
    params: { url: tiktokUrl, hd: 1 },
    timeout: 15000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  const data = response.data;

  if (!data || data.code !== 0 || !data.data) {
    throw new Error(
      (data && data.msg) || "Could not resolve this TikTok video."
    );
  }

  // Prefer the HD, no-watermark play URL if present, otherwise fall back.
  const playPath = data.data.hdplay || data.data.play;
  if (!playPath) {
    throw new Error("No downloadable video was found for this link.");
  }

  // tikwm sometimes returns a relative path — normalize it.
  const videoUrl = playPath.startsWith("http")
    ? playPath
    : `https://www.tikwm.com${playPath}`;

  return {
    videoUrl,
    title: data.data.title || "tiktok_video",
  };
}

/**
 * Stream-download the resolved MP4 to a temp file on disk.
 */
async function downloadToFile(videoUrl, destPath) {
  const writer = fs.createWriteStream(destPath);

  const response = await axios.get(videoUrl, {
    responseType: "stream",
    timeout: 30000,
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  await new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
    response.data.on("error", reject);
  });
}

app.post("/api/download", async (req, res) => {
  const { url } = req.body || {};

  if (!isTikTokUrl(url)) {
    return res.status(400).json({
      error: "Please provide a valid TikTok URL (tiktok.com).",
    });
  }

  try {
    const { videoUrl, title } = await enqueueExternalRequest(() => resolveVideoUrl(url));
    const safeName =
      title.replace(/[^a-z0-9_\-]+/gi, "_").slice(0, 60) || "tiktok_video";

    return res.json({
      data: {
        videoUrl,
        filename: `${safeName}.mp4`,
        title: safeName,
      },
    });
  } catch (err) {
    console.error("Download error:", err.message);
    return res.status(500).json({
      error:
        "Failed to download this TikTok video. It may be private, region-locked, or the link is invalid.",
    });
  }
});

app.use((err, req, res, next) => {
  if (err && err.type === "entity.too.large") {
    return res.status(413).json({
      error: "Request too large. Please use a valid TikTok URL only.",
    });
  }

  console.error("Unhandled error:", err);
  return res.status(500).json({
    error: "Something went wrong on the server. Please try again later.",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    activeExternalRequests,
    queuedRequests: pendingRequests.length,
    maxConcurrentRequests: MAX_CONCURRENT_REQUESTS,
  });
});

// Export for Vercel serverless deployment
module.exports = app;

// For local development
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`TikTok downloader backend running on http://localhost:${PORT}`);
  });
}
