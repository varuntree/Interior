import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface CommunityItem {
  id: string
  title?: string
  image_url: string
  tags?: string[]
}

// removed unused CommunityCollection interface

async function getCollectionItems(collectionId: string): Promise<{
  items: CommunityItem[]
}> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const res = await fetch(
    `${baseUrl}/api/v1/community/collections/${collectionId}/items`,
    { cache: 'no-store' }
  )
  
  if (!res.ok) {
    if (res.status === 404) {
      throw new Error('Collection not found')
    }
    throw new Error('Failed to fetch collection items')
  }
  
  const result = await res.json()
  return result.data
}

export default async function CollectionPage({
  params
}: {
  params: { collectionId: string }
}) {
  try {
    const { items } = await getCollectionItems(params.collectionId)

    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <a 
            href="/community" 
            className="text-sm text-muted-foreground hover:underline mb-4 inline-block"
          >
            ← Back to Community
          </a>
          <h1 className="text-3xl font-bold">Collection Gallery</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <Image
                  src={item.image_url}
                  alt={item.title || 'Community item'}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
                />
              </div>
              {(item.title || item.tags?.length) && (
                <CardContent className="p-4">
                  {item.title && (
                    <h3 className="font-medium text-sm mb-2">{item.title}</h3>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items in this collection yet.</p>
          </div>
        )}
      </div>
    )
  } catch (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold mb-4">Collection Not Found</h1>
          <p className="text-muted-foreground mb-6">
            This collection may not exist or is not published yet.
          </p>
          <a 
            href="/community" 
            className="text-primary hover:underline"
          >
            ← Back to Community
          </a>
        </div>
      </div>
    )
  }
}
