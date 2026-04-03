import dynamic from 'next/dynamic'

// React Flow uses browser APIs — SSR must be disabled
const ArchitectureClient = dynamic(
  () => import('./ArchitectureClient').then((m) => ({ default: m.ArchitectureClient })),
  { ssr: false }
)

export const metadata = { title: 'Architecture — Admin Vanzon' }

export default function ArchitecturePage() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ArchitectureClient />
    </div>
  )
}
