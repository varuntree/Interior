import { ImageResponse } from 'next/og'
import config from '@/config'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function BlogOG() {
  const brand = '#47B3FF'
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', background: brand }}>
        <div style={{ margin: 'auto', width: 1040, height: 470, background: 'white', borderRadius: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
          <div style={{ display: 'flex', fontSize: 60, fontWeight: 800, color: '#0a2540', marginBottom: 12, textAlign: 'center' }}>{config.appName} Blog</div>
          <div style={{ display: 'flex', fontSize: 34, color: '#334155', textAlign: 'center' }}>AI Interior Design Guides & Updates</div>
        </div>
      </div>
    ),
    size
  )
}
