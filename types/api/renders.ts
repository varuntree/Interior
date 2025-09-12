export type RenderListItem = {
  id: string
  coverVariantUrl: string
  createdAt: string
  mode: string
  roomType?: string
  style?: string
}

export type RendersListResponse = {
  success: true
  data: {
    renders: RenderListItem[]
    pagination: { nextCursor: string | null; hasMore: boolean; limit: number }
    totalCount?: number
    filters?: { mode?: string; roomType?: string; style?: string; search?: string }
  }
}

