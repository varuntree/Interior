import { ImageResponse } from 'next/og'
import config from '@/config'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function TwitterImage() {
  const brand = '#47B3FF'
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: brand,
        }}
      >
        <div
          style={{
            width: 1040,
            height: 470,
            background: 'white',
            borderRadius: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#0a2540',
              marginBottom: 16,
              textAlign: 'center',
            }}
          >
            {config.appName}
          </div>
          <div
            style={{
              fontSize: 32,
              lineHeight: 1.3,
              color: '#334155',
              textAlign: 'center',
            }}
          >
            Generate photoreal redesigns with simple presets
          </div>
        </div>
      </div>
    ),
    size
  )
}

