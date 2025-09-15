import { ImageResponse } from 'next/og'
import { articles } from '@/app/(marketing)/blog/_assets/content'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function ArticleOG({ params }: { params: { articleId: string } }) {
  const a = articles.find(x => x.slug === params.articleId)
  const title = a?.title ?? 'QuickDesignHome — AI Interior Design'
  const brand = '#47B3FF'
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: brand }}>
        <div style={{ margin: 'auto', width: 1040, height: 470, background: 'white', borderRadius: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <div style={{ display: 'flex', fontSize: 54, fontWeight: 800, color: '#0a2540', textAlign: 'center' }}>{title}</div>
        </div>
      </div>
    ),
    size
  )
}
