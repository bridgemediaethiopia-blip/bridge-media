import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 px-6 text-center">
      <div className="max-w-2xl rounded-2xl border border-slate-800 bg-slate-900/70 p-10 shadow-2xl">
        <p className="mb-4 text-sm uppercase tracking-[0.3em] text-cyan-400">Bridge Media</p>
        <h1 className="text-4xl font-semibold sm:text-5xl">Launch property campaigns with scan-first lead capture</h1>
        <p className="mt-4 text-lg text-slate-300">
          Staff can manage campaigns, clients, and leads from a protected dashboard while public property pages capture engagement instantly.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link href="/login" className="rounded-lg bg-cyan-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-400">
            Staff sign in
          </Link>
          <Link href="/dashboard" className="rounded-lg border border-slate-700 px-5 py-3 font-medium text-slate-100 transition hover:border-cyan-500">
            Open dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}
