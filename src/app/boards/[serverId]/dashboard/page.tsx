import { DashboardClient } from './DashboardClient'

export function generateStaticParams() {
  return [{ serverId: '00000000-0000-0000-0000-000000000001' }]
}

export default function ClanDashboardPage() {
  return <DashboardClient />
}
