export default function Termsand() {
  return (
    <section id="terms" className="border-t border-white/10 px-2 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
          Terms & Conditions
        </p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Terms of use</h2>

        <div className="mt-6 space-y-5 text-sm text-slate-300 sm:text-base">
          <p>
            By using TikDownloader, you agree to use the service for lawful purposes only and to
            respect the rights of content owners and platform providers.
          </p>

          <ul className="list-disc space-y-2 pl-5 text-slate-300">
            <li>You must not use this service for illegal, harmful, or abusive activity.</li>
            <li>
              You are responsible for ensuring the media you download is allowed under your local laws
              and platform terms.
            </li>
            <li>We do not guarantee access to every video or every platform source at all times.</li>
            <li>We may suspend or block access if misuse, abuse, or technical issues are detected.</li>
          </ul>

          <p>
            We may update, improve, or change the service without prior notice. The tool is provided to
            help users access downloadable media efficiently, but it is not a guarantee of availability
            or compatibility with every external link.
          </p>
        </div>
      </div>
    </section>
  );
}
