import { useState, useEffect } from "react";
import { Link, Route, Routes, useLocation } from "react-router-dom";
import Privy from "./privy";
import Termsand from "./Termsand";
import Contactus from "./Contactus";
import StructuredData from "./StructuredData";
const BACKEND_URL ="http://localhost:5001";
export default function App() {
  return (
    <>
      <StructuredData />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/privacy"
          element={
            <PageLayout>
              <Privy />
            </PageLayout>
          }
        />
        <Route
          path="/terms"
          element={
            <PageLayout>
              <Termsand />
            </PageLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <PageLayout>
              <Contactus />
            </PageLayout>
          }
        />
      </Routes>
    </>
  );
}

function PageLayout({ children }) {
  const location = useLocation();

  useEffect(() => {
    const pageConfig = {
      "/": {
        title: "TikDownloader - Free TikTok Video Downloader Without Watermark",
        description: "Download TikTok videos without watermark for free. Fast, easy, and secure. Works on all devices.",
      },
      "/privacy": {
        title: "Privacy Policy - TikDownloader",
        description: "Read our privacy policy to understand how we protect your data.",
      },
      "/terms": {
        title: "Terms & Conditions - TikDownloader",
        description: "Review our terms and conditions for using TikDownloader.",
      },
      "/contact": {
        title: "Contact Us - TikDownloader",
        description: "Get in touch with our support team for help or questions.",
      },
    };

    const config = pageConfig[location.pathname] || pageConfig["/"];
    document.title = config.title;

    const descMeta = document.querySelector("meta[name='description']");
    if (descMeta) {
      descMeta.setAttribute("content", config.description);
    }

    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-base font-bold tracking-tight sm:text-lg">
            <img
              src="/logo.png"
              alt="TikDownloader logo"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/15"
            />
            <span>
              Tik<span className="text-cyan-400">Downloader</span>
            </span>
          </Link>

          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300 sm:gap-5 sm:text-sm">
            <Link to="/" className="transition hover:text-white">
              Home
            </Link>
            <Link to="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link to="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>
        </nav>
      </header>

      <main className="px-3 py-10 sm:px-6 sm:py-16">{children}</main>
    </div>
  );
}

function HomePage() {
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
        document.getElementById("download-result")?.scrollIntoView({
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

  const handleClearUrl = () => {
    setUrl("");
    setStatus("idle");
    setMessage("");
    setVideoUrl("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="border-b border-white/10 bg-slate-950/80 backdrop-blur-sm">
        <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-base font-bold tracking-tight sm:text-lg md:text-xl">
            <img
              src="/logo.png"
              alt="TikDownloader logo"
              className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/15"
            />
            <span>
              Tik<span className="text-cyan-400">Downloader</span>
            </span>
          </Link>

          <div className="order-3 flex w-full justify-center gap-3 text-[11px] text-slate-300 sm:gap-4 sm:text-xs md:order-none md:w-auto md:justify-end md:text-sm">
            <a href="#how-it-works" className="transition hover:text-white">
              How It Works
            </a>
            <Link to="/privacy" className="transition hover:text-white">
              Privacy
            </Link>
            <Link to="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link to="/contact" className="transition hover:text-white">
              Contact
            </Link>
          </div>

          <a
            href="#downloader"
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium transition hover:bg-white/10 md:hidden"
          >
            Download
          </a>
        </nav>
      </header>

      <main>
        <section id="downloader" className="px-4 pb-14 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="mb-5 inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-[10px] font-medium text-cyan-300 sm:px-4 sm:text-xs">
              Fast & Simple Video Downloader
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-6xl">
              Download TikTok Videos
              <span className="block text-cyan-400">Easily</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base sm:leading-7 md:text-lg">
              Paste a TikTok video link below and get your video ready to download in seconds.
            </p>

            <div className="mx-auto mt-8 max-w-3xl sm:mt-9">
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
                    disabled={status === "loading" || status === "downloading"}
                    placeholder="Paste TikTok URL here..."
                    aria-label="TikTok video URL"
                    className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/10 sm:py-4 sm:text-base"
                  />

                  <div className="flex gap-2 sm:min-w-[220px]">
                    <button
                      type="button"
                      onClick={handleResolve}
                      disabled={status === "loading" || status === "downloading"}
                      className="flex-1 rounded-xl bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60 sm:px-6 sm:py-4 sm:text-base"
                    >
                      {status === "loading" ? "Processing..." : "Download"}
                    </button>

                    {url && (
                      <button
                        type="button"
                        onClick={handleClearUrl}
                        className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60 sm:px-4 sm:text-sm"
                        aria-label="Clear URL"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-3 text-xs text-slate-500">No account required.</p>
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
                  <span className="text-sm text-slate-300">Processing your video...</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {videoUrl && status !== "error" && (
          <section id="download-result" className="scroll-mt-10 px-4 pb-20 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-2xl">
                <div className="border-b border-white/10 px-5 py-4 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-400">
                      ✓
                    </div>

                    <div>
                      <h2 className="font-semibold">Your video is ready</h2>
                      <p className="text-sm text-slate-400">You can preview it before downloading.</p>
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
                    <p className="break-all text-sm font-medium text-white">{filename}</p>
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
                    {status === "downloading" ? "Starting download..." : "Download this video"}
                  </button>

                  {message && status === "success" && (
                    <p className="mt-4 text-center text-sm text-emerald-400" aria-live="polite">
                      {message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        <section id="how-it-works" className="border-t border-white/10 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
                Simple Process
              </p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">How It Works</h2>
              <p className="mx-auto mt-4 max-w-2xl text-slate-400">
                We make it easy to turn a TikTok link into a downloadable video file using a simple and safe process.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              <Step
                number="01"
                title="Paste Your Link"
                description="Copy a supported TikTok video URL and paste it into the downloader field above."
              />
              <Step
                number="02"
                title="Process the Video"
                description="The app sends the URL to our backend service, which retrieves the media file and prepares it for playback."
              />
              <Step
                number="03"
                title="Download"
                description="Once the video is ready, you can preview it and save it to your device with one click."
              />
            </div>

            <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-slate-300">
              <h3 className="text-xl font-semibold text-white">How downloading works</h3>
              <p className="mt-3 leading-7 text-slate-400">
                The downloader reads the TikTok link you enter, requests the video metadata from the source,
                and prepares a downloadable file for your browser. After processing, the result appears in a preview player,
                and you can choose to save the file directly to your device. This keeps the process quick, simple, and user-friendly.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="border-t border-white/10 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">FAQ</p>
              <h2 className="mt-3 text-3xl font-bold">Questions & Answers</h2>
            </div>

            <div className="mt-10 space-y-5">
              <FaqItem
                question="How do I use the downloader?"
                answer="Paste a valid TikTok video URL in the input box and click the Download button. The app will process the link and show a preview before downloading."
              />
              <FaqItem
                question="Does it require an account?"
                answer="No. You can use the downloader without creating an account or signing in."
              />
              <FaqItem
                question="Is this download process safe?"
                answer="The service is designed to handle short download workflows securely. Always use the tool responsibly and respect content ownership rules."
              />
              <FaqItem
                question="Why is my video not downloading?"
                answer="The video may be unavailable, the link may be invalid, or the source may temporarily restrict access. Try again with a valid public URL."
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
            <a href="#how-it-works" className="transition hover:text-white">
              How It Works
            </a>
            <Link to="/privacy" className="transition hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms" className="transition hover:text-white">
              Terms
            </Link>
            <Link to="/contact" className="transition hover:text-white">
              Contact
            </Link>
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
      <div className="text-sm font-bold text-cyan-400">{number}</div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </div>
  );
}

function FaqItem({ question, answer }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-white">{question}</h3>
      <p className="mt-3 leading-7 text-slate-400">{answer}</p>
    </div>
  );
}

