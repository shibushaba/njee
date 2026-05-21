/**
 * Rasterizes `scripts/pwa-icon-source.png` when present; otherwise uses `public/favicon.svg`.
 * Writes crisp PNGs for PWA: 192, 512, maskable 512 — each is a full-bleed square (cover crop, no padded frame).
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

/** Scale to exactly `size`×`size` with no letterboxing — art fills the whole icon. */
async function writeFullBleedIcon(buf, size, outPath) {
  await sharp(buf)
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
      kernel: sharp.kernel.nearest,
    })
    .png({ compressionLevel: 9, effort: 10 })
    .toFile(outPath)
}

async function main() {
  const input = pickInput()
  const sharpInput = input.endsWith('.svg') ? sharp(input, { density: 360 }) : sharp(input)
  const base = await sharpInput.toBuffer()

  await writeFullBleedIcon(base, 192, join(outDir, 'pwa-192.png'))
  await writeFullBleedIcon(base, 512, join(outDir, 'pwa-512.png'))
  await writeFullBleedIcon(base, 512, join(outDir, 'pwa-maskable-512.png'))

  console.log('[pwa-icons] Wrote public/pwa-192.png, pwa-512.png, pwa-maskable-512.png (full bleed) from', input)
}

await main()
