const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const rateLimit = require("express-rate-limit");

const app = express();

const PORT = process.env.PORT || 5001;
const TEMP_DIR = path.join(__dirname, "temp");

const MAX_CONCURRENT_REQUESTS = 4;

let activeExternalRequests = 0;
const pendingRequests = [];

// ============================================================
// TEMP DIRECTORY
// ============================================================

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// ============================================================
// CORS
// ============================================================

const allowedOrigins = [
  "https://www.wadajirict.com",
  "https://wadajirict.com",
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // (health checks, curl, server-to-server requests, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);

      return callback(new Error("Not allowed by CORS"));
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
  })
);

// Handle browser preflight requests
app.options("*", cors());

// ============================================================
// BODY PARSER
// ============================================================

app.use(
  express.json({
    limit: "2mb",
  })
);

// ============================================================
// RATE LIMITER
// ============================================================

const downloadLimiter = rateLimit({
  windowMs: 60 * 1000,

  max: 20,

  standardHeaders: true,

  legacyHeaders: false,

  message: {
    error:
      "Too many download requests at once. Please wait a moment and try again.",
  },
});

app.use("/api/download", downloadLimiter);

// ============================================================
// EXTERNAL REQUEST QUEUE
// ============================================================

function enqueueExternalRequest(task) {
  return new Promise((resolve, reject) => {
    pendingRequests.push({
      task,
      resolve,
      reject,
    });

    drainExternalQueue();
  });
}

function drainExternalQueue() {
  if (
    activeExternalRequests >= MAX_CONCURRENT_REQUESTS ||
    pendingRequests.length === 0
  ) {
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

// ============================================================
// TIKTOK URL VALIDATOR
// ============================================================

function isTikTokUrl(url) {
  if (typeof url !== "string") {
    return false;
  }

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

// ============================================================
// RESOLVE TIKTOK VIDEO
// ============================================================

async function resolveVideoUrl(tiktokUrl) {
  const apiUrl = "https://www.tikwm.com/api/";

  const response = await axios.get(apiUrl, {
    params: {
      url: tiktokUrl,
      hd: 1,
    },

    timeout: 15000,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  const data = response.data;

  if (!data || data.code !== 0 || !data.data) {
    throw new Error(
      (data && data.msg) ||
        "Could not resolve this TikTok video."
    );
  }

  // Prefer HD video
  const playPath =
    data.data.hdplay || data.data.play;

  if (!playPath) {
    throw new Error(
      "No downloadable video was found for this link."
    );
  }

  const videoUrl = playPath.startsWith("http")
    ? playPath
    : `https://www.tikwm.com${playPath}`;

  return {
    videoUrl,
    title: data.data.title || "tiktok_video",
  };
}

// ============================================================
// DOWNLOAD VIDEO TO FILE
// ============================================================

async function downloadToFile(videoUrl, destPath) {
  const writer = fs.createWriteStream(destPath);

  const response = await axios.get(videoUrl, {
    responseType: "stream",

    timeout: 30000,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    },
  });

  await new Promise((resolve, reject) => {
    response.data.pipe(writer);

    writer.on("finish", resolve);

    writer.on("error", reject);

    response.data.on("error", reject);
  });
}

// ============================================================
// DOWNLOAD API
// ============================================================

app.post("/api/download", async (req, res) => {
  const { url } = req.body || {};

  // Validate URL
  if (!isTikTokUrl(url)) {
    return res.status(400).json({
      error:
        "Please provide a valid TikTok URL (tiktok.com).",
    });
  }

  try {
    const {
      videoUrl,
      title,
    } = await enqueueExternalRequest(() =>
      resolveVideoUrl(url)
    );

    const safeName =
      title
        .replace(/[^a-z0-9_\-]+/gi, "_")
        .slice(0, 60) ||
      "tiktok_video";

    return res.json({
      data: {
        videoUrl,

        filename: `${safeName}.mp4`,

        title: safeName,
      },
    });
  } catch (err) {
    console.error(
      "Download error:",
      err.message
    );

    return res.status(500).json({
      error:
        "Failed to download this TikTok video. It may be private, region-locked, or the link is invalid.",
    });
  }
});

// ============================================================
// HEALTH CHECK
// ============================================================

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",

    activeExternalRequests,

    queuedRequests:
      pendingRequests.length,

    maxConcurrentRequests:
      MAX_CONCURRENT_REQUESTS,
  });
});

// ============================================================
// ERROR HANDLER
// ============================================================

app.use((err, req, res, next) => {
  // CORS error
  if (
    err &&
    err.message === "Not allowed by CORS"
  ) {
    return res.status(403).json({
      error: "CORS origin not allowed.",
    });
  }

  // Request too large
  if (
    err &&
    err.type === "entity.too.large"
  ) {
    return res.status(413).json({
      error:
        "Request too large. Please use a valid TikTok URL only.",
    });
  }

  console.error(
    "Unhandled error:",
    err
  );

  return res.status(500).json({
    error:
      "Something went wrong on the server. Please try again later.",
  });
});

// ============================================================
// EXPORT
// ============================================================

module.exports = app;

// ============================================================
// LOCAL DEVELOPMENT
// ============================================================

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(
      `TikTok downloader backend running on http://localhost:${PORT}`
    );
  });
}