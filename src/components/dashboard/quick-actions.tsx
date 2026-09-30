"use client"

import Link from 'next/link'
import { UserPlus, Briefcase, Radio, Zap } from 'lucide-react'
import type { ComponentType } from 'react'

import { useTranslations } from 'next-intl'

// Quick-action shortcuts. Each navigates to the page that owns the
// relevant "create" flow. We deliberately don't try to auto-open any
// modal on the target page — that'd require touching those pages,
// which is out of scope here.
interface Action {
  labelKey: string
  href: string
  icon: ComponentType<{ className?: string }>
  tint: string
}

const ACTIONS: Action[] = [
  { labelKey: 'newContact', href: '/contacts', icon: UserPlus, tint: 'text-[#d4a017] bg-[#d4a017]/10 border-[#d4a017]/25' },
  { labelKey: 'newDeal', href: '/pipelines', icon: Briefcase, tint: 'text-[#00f0ff] bg-[#00f0ff]/10 border-[#00f0ff]/25' },
  { labelKey: 'newBroadcast', href: '/broadcasts/new', icon: Radio, tint: 'text-[#ff2a85] bg-[#ff2a85]/10 border-[#ff2a85]/25' },
  { labelKey: 'newAutomation', href: '/automations/new', icon: Zap, tint: 'text-[#9d4edd] bg-[#9d4edd]/10 border-[#9d4edd]/25' },
]

export function QuickActions() {
  const t = useTranslations('Dashboard.quickActions')
  
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {ACTIONS.map((a) => {
        const Icon = a.icon
        return (
          <Link
            key={a.href}
            href={a.href}
            className="group relative flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-[#0c0915]/80 px-4 py-3.5 backdrop-blur-xl shadow-md transition-all duration-300 hover:border-white/20 hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(212,160,23,0.12)]"
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${a.tint} transition-transform duration-300 group-hover:scale-110`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white" style={{ fontFamily: 'var(--font-heading)' }}>
              {t(a.labelKey as string)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
