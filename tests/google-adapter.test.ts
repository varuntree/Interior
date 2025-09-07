import { describe, it, expect } from 'vitest'
import { toGoogleNanoBananaInputs } from '../libs/services/external/googleNanoBananaAdapter'

describe('Google nano-banana Adapter', () => {
  it('maps prompt and omits when no images', () => {
    const req: any = {
      ownerId: 'user-1',
      mode: 'imagine',
      prompt: 'a sunny living room',
    }
    const inputs = toGoogleNanoBananaInputs(req, [], { forceJpg: true })
    expect(inputs.prompt).toBe('a sunny living room')
    expect(inputs.image_input).toBeUndefined()
    expect(inputs.output_format).toBe('jpg')
  })

  it('passes image_input array when provided', () => {
    const req: any = { ownerId: 'u', mode: 'redesign', prompt: 'modern' }
    const urls = ['https://ex.com/a.jpg', 'https://ex.com/b.jpg']
    const inputs = toGoogleNanoBananaInputs(req, urls)
    expect(inputs.image_input).toEqual(urls)
    expect(inputs.output_format).toBeUndefined() // default jpg on server
  })
})

