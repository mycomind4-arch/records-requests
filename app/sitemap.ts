import type { MetadataRoute } from 'next'
import { workflows } from './workflows/workflow-data'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://records.mailmypdf.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: baseUrl, changeFrequency: 'weekly', priority: 1 },
    ...workflows.map(workflow => ({
      url: `${baseUrl}/workflows/${workflow.slug}`,
      changeFrequency: 'weekly' as const,
      priority: workflow.slug === 'code-enforcement-records' ? 0.95 : 0.8,
    })),
  ]
}
