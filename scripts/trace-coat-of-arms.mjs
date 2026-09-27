/**
 * Трассировка силуэта герба (WebP, форма в alpha) → SVG path.
 * Запуск: node scripts/trace-coat-of-arms.mjs
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'
import ImageTracer from 'imagetracerjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const source = path.join(root, 'public/backgrounds/rf-coat-of-arms-source.webp')
const outSvg = path.join(root, 'src/backgrounds/rf-coat-of-arms.svg')
const outReact = path.join(root, 'src/backgrounds/RfCoatOfArms.tsx')

const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true })

// Форма герба в alpha: непрозрачное → чёрный силуэт на белом
const rgba = new Uint8ClampedArray(info.width * info.height * 4)
let emblemPixels = 0
for (let i = 0; i < info.width * info.height; i++) {
  const o = i * 4
  const a = data[o + 3]
  const isEmblem = a > 96
  if (isEmblem) emblemPixels++
  const v = isEmblem ? 0 : 255
  rgba[o] = v
  rgba[o + 1] = v
  rgba[o + 2] = v
  rgba[o + 3] = 255
}

console.log(`source ${info.width}x${info.height}, emblemPixels=${emblemPixels}`)

const svg = ImageTracer.imagedataToSVG(
  { width: info.width, height: info.height, data: rgba },
  {
    ltres: 0.6,
    qtres: 0.6,
    pathomit: 2,
    colorsampling: 0,
    numberofcolors: 2,
    mincolorratio: 0,
    colorquantcycles: 2,
    blurradius: 0,
    blurdelta: 20,
    linefilter: true,
    scale: 1,
    roundcoords: 2,
    viewbox: true,
    desc: false,
    lcpr: 0,
    qcpr: 0,
  },
)

const pathMatches = [
  ...svg.matchAll(/<path[^>]*fill="([^"]*)"[^>]*d="([^"]*)"[^>]*\/>/g),
]

function isDarkFill(fill) {
  const f = fill.toLowerCase()
  if (f.startsWith('rgb')) {
    const nums = f.match(/\d+/g)?.map(Number) ?? [255]
    return nums[0] < 128
  }
  if (f.startsWith('#')) {
    const hex = f.slice(1)
    const n = parseInt(hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2), 16)
    return n < 128
  }
  return f === 'black'
}

const darkPaths = pathMatches.filter((m) => isDarkFill(m[1]))
if (darkPaths.length === 0) {
  console.error('Не удалось выделить силуэт')
  fs.writeFileSync(path.join(root, 'public/backgrounds/debug-trace.svg'), svg)
  process.exit(1)
}

const viewBoxMatch = svg.match(/viewBox="([^"]+)"/)
const viewBox = viewBoxMatch?.[1] ?? `0 0 ${info.width} ${info.height}`
const pathD = darkPaths.map((m) => m[2]).join(' ')

const cleanSvg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="currentColor">
  <path d="${pathD}"/>
</svg>
`

fs.writeFileSync(outSvg, cleanSvg, 'utf8')

const reactComponent = `// Векторизованный силуэт герба (трассировка референса 500×500).
// Цвет задаётся через fill / currentColor.

type RfCoatOfArmsProps = {
  fill?: string
  className?: string
}

export function RfCoatOfArms({
  fill = 'currentColor',
  className,
}: RfCoatOfArmsProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="${viewBox}"
      fill={fill}
      aria-hidden="true"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="${pathD}" />
    </svg>
  )
}
`

fs.writeFileSync(outReact, reactComponent, 'utf8')

console.log(`OK paths=${darkPaths.length}, svg=${Buffer.byteLength(cleanSvg)} bytes`)
console.log(`→ ${outSvg}`)
console.log(`→ ${outReact}`)
