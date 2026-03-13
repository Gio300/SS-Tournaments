import { MatchDetailClient } from './MatchDetailClient'

export function generateStaticParams() {
  return [{ id: '00000000-0000-0000-0000-000000000000' }]
}

export default function MatchDetailPage() {
  return <MatchDetailClient />
}
