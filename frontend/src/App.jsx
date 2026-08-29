 
 
import { useState } from "react";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:500";

export default function App() {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [filename, setFilename] = useState("tiktok_video.mp4");

  const handleResolve = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      setStatus("error");
      setMessage("Please paste a TikTok URL first.");
      setVideoUrl("");
      return;
    }

    setStatus("loading");
    setMessage("");
    setVideoUrl("");

    try {
      const response = await fetch(`${BACKEND_URL}/api/download`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: trimmedUrl,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "Unable to process this video.");
      }

      const result = data.data || data;

      if (!result.videoUrl) {
        throw new Error(
          "The server processed the request but did not return a video."
        );
      }

      setVideoUrl(result.videoUrl);
      setFilename(result.filename || "tiktok_video.mp4");
      setStatus("success");
      setMessage("Your video is ready.");

      setTimeout(() => {
        document
          .getElementById("download-result")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 100);
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    }
  };

  const handleBrowserDownload = async () => {
    if (!videoUrl) return;

    try {
      setStatus("downloading");
      setMessage("");

      const response = await fetch(videoUrl);

      if (!response.ok) {
        throw new Error("The video could not be downloaded.");
      }

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(blobUrl);

      setStatus("success");
      setMessage("Video download started.");
    } catch {
      const link = document.createElement("a");

      link.href = videoUrl;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noopener noreferrer";

      document.body.appendChild(link);
      link.click();
      link.remove();

      setStatus("success");
      setMessage("Your browser is handling the download.");
    }
  };

  const handleInputChange = (event) => {
    setUrl(event.target.value);

    if (status !== "idle") {
      setStatus("idle");
      setMessage("");
      setVideoUrl("");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
          <a
            href="/"
            className="flex items-center gap-3 text-lg font-bold tracking-tight sm:text-xl"
          >
            <img
              src="/logo.png"
              alt="TikDownloader logo"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/15"
            />
            <span>
              Tik<span className="text-cyan-400">Downloader</span>
            </span>
          </a>

          <div className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
            <a
              href="#how-it-works"
              className="transition hover:text-white"
            >
              How It Works
            </a>

            <a
              href="/about"
              className="transition hover:text-white"
            >
              About
            </a>

            <a
              href="/contact"
              className="transition hover:text-white"
            >
              Contact
            </a>
          </div>

          <a
            href="#downloader"
            className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium transition hover:bg-white/10 md:hidden"
          >
            Download
          </a>
        </nav>
      </header>

      <main>
        <section
          id="downloader"
          className="px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24"
        >
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-medium text-cyan-300 sm:text-sm">
              Fast & Simple Video Downloader
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Download TikTok Videos
              <span className="block text-cyan-400">
                Easily
              </span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg">
              Paste a TikTok video link below and get your
              video ready to download in seconds.
            </p>

            <div className="mx-auto mt-9 max-w-3xl">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2 shadow-2xl sm:p-3">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input
                    type="url"
                    value={url}
                    onChange={handleInputChange}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        handleResolve();
                      }
                    }}
                    disabled={
                      status === "loading" ||
                      status === "downloading"
                    }
                    placeholder="Paste TikTok URL here..."
                    aria-label="TikTok video URL"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 sm:text-base"
                  />

                  <button
                    type="button"
                    onClick={handleResolve}
                    disabled={
                      status === "loading" ||
                      status === "downloading"
                    }
                    className="rounded-xl bg-cyan-400 px-6 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[140px] sm:text-base"
                  >
                    {status === "loading"
                      ? "Processing..."
                      : "Download"}
                  </button>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">
                No account required.
              </p>
            </div>

            {status === "error" && (
              <div
                role="alert"
                className="mx-auto mt-6 max-w-2xl rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm text-red-300"
              >
                {message}
              </div>
            )}

            {status === "loading" && (
              <div
                className="mx-auto mt-8 max-w-md rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4"
                aria-live="polite"
              >
                <div className="flex items-center justify-center gap-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-cyan-400" />

                  <span className="text-sm text-slate-300">
                    Processing your video...
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>

        {videoUrl && status !== "error" && (
          <section
            id="download-result"
            className="scroll-mt-10 px-4 pb-20 sm:px-6"
          >
            <div className="mx-auto max-w-3xl">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
                <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                      ✓
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Your video is ready
                      </h2>

                      <p className="text-sm text-slate-400">
                        You can preview it before downloading.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-black">
                  <video
                    src={videoUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="mx-auto max-h-[650px] w-full object-contain"
                  >
                    Your browser does not support video playback.
                  </video>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="mb-5">
                    <p className="break-all text-sm font-medium text-white">
                      {filename}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Click the button below to download the video.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBrowserDownload}
                    disabled={status === "downloading"}
                    className="w-full rounded-xl bg-cyan-400 px-6 py-4 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:text-base"
                  >
                    {status === "downloading"
                      ? "Starting download..."
                      : "Download this video"}
                  </button>

                  {message && status === "success" && (
                    <p
                      className="mt-4 text-center text-sm text-emerald-400"
                      aria-live="polite"
                    >
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section
          id="how-it-works"
          className="border-t border-white/10 px-4 py-20 sm:px-6"
        >
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Simple Process
              </p>

              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                How It Works
              </h2>

              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                Get your video ready in just a few simple steps.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Step
                number="01"
                title="Paste Your Link"
                description="Copy a supported TikTok video link and paste it into the downloader."
              />

              <Step
                number="02"
                title="Process the Video"
                description="Click Download and wait while your video is processed."
              />

              <Step
                number="03"
                title="Download"
                description="Preview the result and click Download this video to save it."
              />
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-5 sm:grid-cols-3">
              <Feature
                title="No Account"
                description="Use the downloader without creating an account."
              />

              <Feature
                title="Mobile Friendly"
                description="Designed to work smoothly on phones, tablets, and computers."
              />

              <Feature
                title="Simple Interface"
                description="Paste your link, preview the result, and download."
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 px-4 py-10 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-bold">
              Tik<span className="text-cyan-400">Downloader</span>
            </p>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              A simple online video downloading tool.
            </p>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-400">
            <a
              href="/about"
              className="transition hover:text-white"
            >
              About
            </a>

            <a
              href="/contact"
              className="transition hover:text-white"
            >
              Contact
            </a>

            <a
              href="/terms"
              className="transition hover:text-white"
            >
              Terms
            </a>

            <a
              href="/privacy"
              className="transition hover:text-white"
            >
              Privacy
            </a>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-6xl border-t border-white/10 pt-6 text-xs text-slate-600">
          © 2026 TikDownloader. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function Step({ number, title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <div className="text-sm font-bold text-cyan-400">
        {number}
      </div>

      <h3 className="mt-4 text-lg font-semibold">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}

function Feature({ title, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="font-semibold">{title}</h3>

      <p className="mt-2 text-sm leading-6 text-slate-400">
        {description}
      </p>
    </div>
  );
}
 
