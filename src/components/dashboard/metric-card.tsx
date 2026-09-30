import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { ComponentType } from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  /** Pre-formatted value for display (e.g. "42" or "$1,250"). */
  value: string
  icon: ComponentType<{ className?: string }>
  /**
   * Delta-mode secondary row: arrow + delta text. Omit when the metric
   * doesn't have a sensible comparison (e.g. total pipeline value).
   */
  delta?: {
    /** Positive / negative / zero drives arrow + color. */
    sign: number
    /** Pre-formatted delta, e.g. "+3 vs yesterday". */
    label: string
  }
  /** Used instead of `delta` when the metric has a static subtitle. */
  subtitle?: string
}

export function MetricCard({ title, value, icon: Icon, delta, subtitle }: MetricCardProps) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0c0915]/80 p-5 backdrop-blur-xl shadow-lg hover:border-white/20 transition-all duration-300 hover:shadow-[0_0_25px_rgba(212,160,23,0.15)]">
      {/* Top ambient color reflection line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4a017]/60 to-transparent opacity-75 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between">
        <p className="text-xs uppercase tracking-wider font-semibold text-gray-400" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#d4a017] group-hover:border-[#d4a017]/40 group-hover:scale-110 transition-all duration-300">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 text-[32px] leading-none font-bold tabular-nums text-white tracking-tight" style={{ fontFamily: 'var(--font-heading)' }}>
        {value}
      </p>
      {delta ? <DeltaRow sign={delta.sign} label={delta.label} /> : subtitle ? (
        <p className="mt-2 text-xs text-gray-400">{subtitle}</p>
      ) : null}
    </div>
  )
}

function DeltaRow({ sign, label }: { sign: number; label: string }) {
  const tone =
    sign > 0
      ? 'text-[#00f0ff]'
      : sign < 0
      ? 'text-[#ff2a85]'
      : 'text-gray-400'
  const Arrow = sign > 0 ? ArrowUp : sign < 0 ? ArrowDown : Minus
  return (
    <div className={cn('mt-2 flex items-center gap-1 text-xs font-medium', tone)}>
      <Arrow className="h-3.5 w-3.5" aria-hidden />
      <span className="tabular-nums">{label}</span>
    </div>
  )
}
