import { notFound } from 'next/navigation'
import { workflows } from '../../workflow-data'
import CodeEnforcementBuilder from './builder'

export default async function WorkflowBuilderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const workflow = workflows.find((item) => item.slug === slug)
  if (!workflow || slug !== 'code-enforcement-records') notFound()

  return <CodeEnforcementBuilder />
}
