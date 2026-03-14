export function generateStaticParams() {
  return [{ userId: 'placeholder' }]
}

export default function ProfileUserIdLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
