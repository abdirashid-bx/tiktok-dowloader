const express = require("express");
const cors = require("cors");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 5001;
const TEMP_DIR = path.join(__dirname, "temp");

// Make sure the temp folder exists
if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

app.use(cors());
app.use(express.json());

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
    const { videoUrl, title } = await resolveVideoUrl(url);
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

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`TikTok downloader backend running on http://localhost:${PORT}`);
});
