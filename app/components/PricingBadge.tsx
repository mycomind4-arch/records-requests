'use client'

import { useMemo } from 'react'

type PricingBadgeProps = {
  workflowId: string
}

type PricingInfo = {
  band: string
  basePriceCents: number
  commercialStatus: string
  pricingRationale?: string
}

// Import the pricing package — it's a pure computation library, safe for client
import { getWorkflowPricingProfile } from '@mailmypdf/pricing'

export function PricingBadge({ workflowId }: PricingBadgeProps) {
  const pricing = useMemo(() => {
    const profile = getWorkflowPricingProfile(workflowId)
    if (!profile) return null
    return {
      band: profile.band,
      basePriceCents: profile.basePriceCents,
      commercialStatus: profile.commercialStatus,
      pricingRationale: profile.pricingRationale,
    } as PricingInfo
  }, [workflowId])

  if (!pricing || pricing.commercialStatus !== 'production') return null

  const priceDisplay = pricing.basePriceCents === 0
    ? 'Free'
    : `$${(pricing.basePriceCents / 100).toFixed(2)}`

  const bandLabels: Record<string, string> = {
    FREE: 'Free',
    ESSENTIAL: 'Essential',
    STANDARD: 'Standard',
    ADVANCED: 'Advanced',
    HIGH_STAKES: 'High Stakes',
  }

  return (
    <div className="pricing-badge" style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 10,
      padding: '6px 14px',
      borderRadius: 8,
      background: 'var(--surface-2, #f5f5f0)',
      border: '1px solid var(--border, #e0e0d8)',
      fontSize: 14,
    }}>
      <span style={{ fontWeight: 600, color: 'var(--ink, #1a1a2e)' }}>{priceDisplay}</span>
      <span style={{ color: 'var(--ink-muted, #6b6b80)', fontSize: 12 }}>
        {bandLabels[pricing.band] ?? pricing.band} · {pricing.pricingRationale ?? 'Request preparation fee'}
      </span>
    </div>
  )
}
