"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AcceptInvitePage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [inviteToken, setInviteToken] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data, error }) => {
      if (!error && data.user) {
        router.replace('/dashboard')
      }
    })
  }, [router])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { invite_token: inviteToken },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })

    if (error) {
      setError(error.message)
      setIsLoading(false)
      return
    }

    if (data.session) {
      router.push('/dashboard')
      return
    }

    setError('Your account was created. Please confirm your email if required before signing in.')
    setIsLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-10">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Accept Invite</p>
        <h1 className="mt-3 text-3xl font-semibold">Set up your staff access</h1>
        <p className="mt-2 text-sm text-slate-400">Complete the invite form to activate your Bridge Media account.</p>
        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="email">Email</label>
            <input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="you@bridge.media" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="token">Invite token</label>
            <input id="token" value={inviteToken} onChange={(event) => setInviteToken(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="invite-token" />
          </div>
          <div>
            <label className="mb-2 block text-sm text-slate-300" htmlFor="password">Create password</label>
            <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="••••••••" />
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button type="submit" disabled={isLoading} className="w-full rounded-lg bg-cyan-500 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-70">
            {isLoading ? 'Activating…' : 'Activate account'}
          </button>
        </form>
      </div>
    </main>
  )
}
