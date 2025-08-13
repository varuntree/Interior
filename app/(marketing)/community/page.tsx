import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CommunityCollection {
  id: string
  title: string
  description?: string
  cover_image_url?: string
}

async function getCollections(): Promise<{ collections: CommunityCollection[] }> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/v1/community/collections`, {
    cache: 'no-store'
  })
  
  if (!res.ok) {
    throw new Error('Failed to fetch collections')
  }
  
  const result = await res.json()
  return result.data
}

export default async function CommunityPage() {
  const { collections } = await getCollections()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Community Gallery</h1>
        <p className="text-muted-foreground">
          Discover curated interior design inspiration from our community
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {collections.map((collection) => (
          <Card key={collection.id} className="hover:shadow-lg transition-shadow">
            <a href={`/community/${collection.id}`}>
              {collection.cover_image_url && (
                <div className="aspect-video relative overflow-hidden rounded-t-lg">
                  <Image
                    src={collection.cover_image_url}
                    alt={collection.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{collection.title}</CardTitle>
                {collection.description && (
                  <CardDescription>{collection.description}</CardDescription>
                )}
              </CardHeader>
            </a>
          </Card>
        ))}
      </div>

      {collections.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No collections published yet.</p>
        </div>
      )}
    </div>
  )
}