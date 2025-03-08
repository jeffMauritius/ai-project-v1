import VenueDetail from './VenueDetail'

export async function generateStaticParams() {
  // Generate params for venues with IDs 1, 2, and 3
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' }
  ]
}

export default function VenuePage({ params }: { params: { id: string } }) {
  return <VenueDetail id={params.id} />
}