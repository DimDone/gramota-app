// SVG-фон грамоты: орнаментальная рамка + векторизованный герб.

import type { Orientation } from '../types'
import { RfCoatOfArms } from './RfCoatOfArms'
import type { BackgroundTheme } from './themes'

type CertificateBackgroundProps = {
  orientation: Orientation
  theme: BackgroundTheme
}

/**
 * Декоративный фон.
 * viewBox совпадает с пропорциями A4: 210×297 или 297×210.
 */
export function CertificateBackground({
  orientation,
  theme,
}: CertificateBackgroundProps) {
  if (theme.id === 'none') return null

  const width = orientation === 'portrait' ? 210 : 297
  const height = orientation === 'portrait' ? 297 : 210

  // Герб в верхней зоне листа
  const emblemW = orientation === 'portrait' ? 38 : 32
  const emblemH = emblemW
  const emblemX = (width - emblemW) / 2
  const emblemY = orientation === 'portrait' ? 13.5 : 10.5

  return (
    <svg
      className="certificate-background"
      viewBox={`0 0 ${width} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      {/* Бумага */}
      <rect width={width} height={height} fill={theme.paper} />

      {/* Внешняя и внутренняя рамки */}
      <rect
        x={6}
        y={6}
        width={width - 12}
        height={height - 12}
        fill="none"
        stroke={theme.frame}
        strokeWidth={1.4}
      />
      <rect
        x={9}
        y={9}
        width={width - 18}
        height={height - 18}
        fill="none"
        stroke={theme.accent}
        strokeWidth={0.55}
      />
      <rect
        x={11.5}
        y={11.5}
        width={width - 23}
        height={height - 23}
        fill="none"
        stroke={theme.frame}
        strokeWidth={0.35}
        strokeDasharray="1.2 1.1"
        opacity={0.75}
      />

      {/* Угловые розетки */}
      <CornerOrnament x={14} y={14} color={theme.frame} accent={theme.accent} />
      <CornerOrnament
        x={width - 14}
        y={14}
        color={theme.frame}
        accent={theme.accent}
        rotate={90}
      />
      <CornerOrnament
        x={width - 14}
        y={height - 14}
        color={theme.frame}
        accent={theme.accent}
        rotate={180}
      />
      <CornerOrnament
        x={14}
        y={height - 14}
        color={theme.frame}
        accent={theme.accent}
        rotate={270}
      />

      {/* Орнамент по верхнему/нижнему краю */}
      <SideFlourish
        x={width / 2}
        y={12.5}
        color={theme.accent}
        length={orientation === 'portrait' ? 70 : 110}
      />
      <SideFlourish
        x={width / 2}
        y={height - 12.5}
        color={theme.accent}
        length={orientation === 'portrait' ? 70 : 110}
      />

      {/* Векторный герб (трассировка референса), цвет темы */}
      <RfCoatOfArms
        fill={theme.emblem}
        x={emblemX}
        y={emblemY}
        width={emblemW}
        height={emblemH}
      />
    </svg>
  )
}

function CornerOrnament({
  x,
  y,
  color,
  accent,
  rotate = 0,
}: {
  x: number
  y: number
  color: string
  accent: string
  rotate?: number
}) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      <path
        d="M0 0 L8 0 L8 1.2 L1.2 1.2 L1.2 8 L0 8 Z"
        fill={color}
        opacity={0.9}
      />
      <circle cx={3.2} cy={3.2} r={1.15} fill={accent} />
      <path
        d="M0 10 Q4 6 10 0"
        fill="none"
        stroke={accent}
        strokeWidth={0.45}
      />
    </g>
  )
}

function SideFlourish({
  x,
  y,
  color,
  length,
}: {
  x: number
  y: number
  color: string
  length: number
}) {
  const half = length / 2
  return (
    <g transform={`translate(${x} ${y})`} opacity={0.85}>
      <path
        d={`M${-half} 0 Q${-half / 2} -2.2 0 0 Q${half / 2} 2.2 ${half} 0`}
        fill="none"
        stroke={color}
        strokeWidth={0.45}
      />
      <circle cx={0} cy={0} r={0.9} fill={color} />
    </g>
  )
}
