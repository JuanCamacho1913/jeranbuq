import sharp from 'sharp'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '../public')

async function generateIcon(size) {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${size}" height="${size}" fill="#1a1a1a"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-weight="bold"
      font-size="${Math.floor(size * 0.4)}" fill="white" text-anchor="middle"
      dominant-baseline="central">JB</text>
  </svg>`
  await sharp(Buffer.from(svg)).png().toFile(path.join(publicDir, `icon-${size}x${size}.png`))
  console.log(`Generated icon-${size}x${size}.png`)
}

await generateIcon(192)
await generateIcon(512)
