import sharp from 'sharp'
import type { Buffer } from 'node:buffer'

export async function processAccountImage(input: Buffer) {
  const image = sharp(input, { limitInputPixels: 25_000_000, animated: false })
  const metadata = await image.metadata()
  if (!['png', 'jpeg', 'webp'].includes(metadata.format || '')) throw new Error('Neveljavna slika.')
  const { data, info } = await image
    .rotate()
    .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer({ resolveWithObject: true })
  return {
    bytes: data,
    details: { width: info.width, height: info.height, format: 'webp', processingVersion: 1 },
  }
}
