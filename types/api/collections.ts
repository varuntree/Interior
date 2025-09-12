export type CollectionSummary = {
  id: string
  name: string
  isDefaultFavorites: boolean
  itemCount: number
  createdAt: string
}

export type CollectionsListResponse = {
  success: true
  data: {
    collections: CollectionSummary[]
  }
}

