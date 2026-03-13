import { BoardChannelClient } from './BoardChannelClient'

export function generateStaticParams() {
  return [{ serverId: '00000000-0000-0000-0000-000000000001', channelId: '00000000-0000-0000-0000-000000000002' }]
}

export default function BoardChannelPage() {
  return <BoardChannelClient />
}
