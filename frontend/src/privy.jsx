export default function Privy() {
  return (
    <section id="privacy-policy" className="border-t border-white/10 px-2 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
          Privacy Policy
        </p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Your privacy matters</h2>

        <div className="mt-6 space-y-5 text-sm text-slate-300 sm:text-base">
          <p>
            We respect your privacy and aim to keep the downloading experience simple and secure.
            We do not require an account to use this service.
          </p>

          <p>
            When you paste a TikTok URL, the system temporarily processes that link to fetch the video
            and prepare it for download. We do not store personal account details or unnecessary user
            information.
          </p>

          <ul className="list-disc space-y-2 pl-5 text-slate-300">
            <li>We only process the URL required to fetch the media file.</li>
            <li>We do not sell or share your personal data with third parties.</li>
            <li>We may keep temporary technical logs to improve service quality and detect abuse.</li>
            <li>
              Any downloaded content remains your responsibility to use in compliance with applicable
              laws and platform rules.
            </li>
          </ul>

          <p>
            If you use this tool, you agree that the service is provided as-is and that we may update
            our privacy practices over time. Continued use after updates means you accept those changes.
          </p>
        </div>
      </div>
    </section>
  );
}
