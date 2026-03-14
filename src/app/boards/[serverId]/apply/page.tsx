import { ApplyClient } from './ApplyClient'

export function generateStaticParams() {
  return [{ serverId: '00000000-0000-0000-0000-000000000001' }]
}

export default function ApplyToClanPage() {
  return <ApplyClient />
}
