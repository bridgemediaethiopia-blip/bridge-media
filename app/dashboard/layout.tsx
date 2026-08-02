import Link from 'next/link'
import { redirect } from 'next/navigation'
import { LayoutDashboard, Users, PlusCircle, BadgeCheck, UserCircle2, LogOut } from 'lucide-react'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const navigation = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/dashboard/campaigns/new', label: 'New Campaign', icon: PlusCircle },
  { href: '/dashboard/leads', label: 'Leads', icon: BadgeCheck },
  { href: '/dashboard/clients', label: 'Clients', icon: Users },
]

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-slate-800 bg-slate-900/90 p-6 lg:flex">
          <div className="mb-10">
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Bridge Media</p>
            <h2 className="mt-2 text-2xl font-semibold">Staff Console</h2>
          </div>
          <nav className="space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
          <div className="mt-auto rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-3">
              <UserCircle2 className="h-8 w-8 text-cyan-400" />
              <div>
                <p className="font-medium">Staff Account</p>
                <p className="text-sm text-slate-400">Operations</p>
              </div>
            </div>
            <form action="/auth/signout" method="GET" className="mt-4">
              <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-rose-400 hover:text-rose-300">
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </aside>

        <div className="flex-1">
          <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Welcome back</p>
                <h1 className="text-xl font-semibold">Bridge Media Dashboard</h1>
              </div>
              <div className="flex items-center gap-3 rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-300">
                <UserCircle2 className="h-4 w-4" />
                Staff
              </div>
            </div>
          </header>
          <main className="p-6">{children}</main>
        </div>
      </div>
    </div>
  )
}
