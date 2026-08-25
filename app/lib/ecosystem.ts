/**
 * MailMyPDF Ecosystem — shared navigation data for Records Requests.
 * Keeps all vertical links in one place so headers and footers stay in sync.
 */

export interface EcosystemProduct {
  name: string
  href: string
  description: string
}

export const ECOSYSTEM_PRODUCTS: EcosystemProduct[] = [
  { name: 'MailMyPDF', href: 'https://mailmypdf-etc.pages.dev', description: 'Core document and letter mailing workflows' },
  { name: 'Notice Respond', href: 'https://notice-respond.pages.dev', description: 'Official notices, agency actions, and formal responses' },
  { name: 'Immigration Mail', href: 'https://immigration-mail.pages.dev', description: 'Immigration notices, evidence packages, and explanation letters' },
  { name: 'Appeal Mail', href: 'https://mycomind4-arch-appeal-mail.pages.dev', description: 'Appeals, reconsiderations, denials, and adverse decisions' },
  { name: 'Dispute Mail', href: 'https://mycomind4-arch-dispute-mail.pages.dev', description: 'Debt, credit, billing, collections, and consumer disputes' },
  { name: 'Private Office', href: 'https://mycomind4-arch-mailmypdf-private-office.pages.dev', description: 'Professional correspondence, provably delivered' },
]

export const ECOSYSTEM_PAGE_URL = 'https://mailmypdf-etc.pages.dev/products'
export const MAILMYPDF_HOME = 'https://mailmypdf-etc.pages.dev'
