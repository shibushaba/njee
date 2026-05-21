/**
 * Rasterizes `scripts/pwa-icon-source.png` when present; otherwise uses `public/favicon.svg`.
 * Writes crisp PNGs for PWA: 192, 512, maskable 512 (content ~72% for safe zones).
 */
import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const outDir = join(root, 'public')
const pngSource = join(root, 'scripts', 'pwa-icon-source.png')
const svgFallback = join(root, 'public', 'favicon.svg')

function pickInput() {
  if (existsSync(pngSource)) return pngSource
  if (existsSync(svgFallback)) return svgFallback
  console.warn('[pwa-icons] No scripts/pwa-icon-source.png or public/favicon.svg — skipping.')
  process.exit(0)
}

async function rasterToSquare(buf, size) {
  return sharp(buf)
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.nearest,
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()
}

async function maskable512(buf) {
  const s = 512
  const inner = Math.round(s * 0.72)
  const resized = await sharp(buf)
    .resize(inner, inner, {
      fit: 'contain',
      position: 'centre',
      kernel: sharp.kernel.nearest,
      background: { r: 127, g: 186, b: 106, alpha: 1 },
    })
    .png()
    .toBuffer()
  const meta = await sharp(resized).metadata()
  const w = meta.width ?? inner
  const h = meta.height ?? inner
  const left = Math.floor((s - w) / 2)
  const top = Math.floor((s - h) / 2)
  return sharp({
    create: {
      width: s,
      height: s,
      channels: 4,
      background: { r: 245, g: 217, b: 166, alpha: 1 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(join(outDir, 'pwa-maskable-512.png'))
}

async function main() {
  const input = pickInput()
  const sharpInput = input.endsWith('.svg') ? sharp(input, { density: 360 }) : sharp(input)
  const base = await sharpInput.toBuffer()

  await sharp(await rasterToSquare(base, 192)).toFile(join(outDir, 'pwa-192.png'))
  await sharp(await rasterToSquare(base, 512)).toFile(join(outDir, 'pwa-512.png'))
  await maskable512(base)

  console.log('[pwa-icons] Wrote public/pwa-192.png, pwa-512.png, pwa-maskable-512.png from', input)
}

await main()
