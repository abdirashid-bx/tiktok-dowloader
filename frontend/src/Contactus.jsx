export default function Contactus() {
  return (
    <section id="contact" className="border-t border-white/10 px-2 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl rounded-3xl border border-white/10 bg-white/[0.02] p-4 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-wider text-cyan-400">
          Contact Us
        </p>
        <h2 className="mt-3 text-2xl font-bold sm:text-3xl">We’re here to help</h2>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h3 className="text-lg font-semibold text-white">Email support</h3>
            <p className="mt-3 text-slate-400">For questions, issues, or support requests:</p>
            <a href="mailto:support@tiktokdownloader.com" className="mt-3 inline-block text-cyan-400 hover:text-cyan-300">
              support@tiktokdownloader.com
            </a>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5">
            <h3 className="text-lg font-semibold text-white">Business inquiries</h3>
            <p className="mt-3 text-slate-400">For partnerships and business-related messages:</p>
            <a href="mailto:hello@tiktokdownloader.com" className="mt-3 inline-block text-cyan-400 hover:text-cyan-300">
              hello@tiktokdownloader.com
            </a>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-slate-300">
          <p>
            Please include your name, email, and a brief description of your question or issue so we can
            respond as quickly as possible.
          </p>
        </div>
      </div>
    </section>
  );
}
