import PartnerDetail from './PartnerDetail'

export async function generateStaticParams() {
  // Generate params for partners with IDs 1, 2, and 3
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' }
  ]
}

export default function PartnerPage({ params }: { params: { id: string } }) {
  return <PartnerDetail id={params.id} />
}