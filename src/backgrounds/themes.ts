// Цветовые темы фонов грамоты (пустышки с рамкой и стилизованным гербом).

export type BackgroundThemeId =
  | 'none'
  | 'classic'
  | 'imperial'
  | 'azure'
  | 'emerald'
  | 'graphite'
  | 'wine'

export type BackgroundTheme = {
  id: BackgroundThemeId
  label: string
  /** Цвет бумаги */
  paper: string
  /** Основной цвет рамки/орнамента */
  frame: string
  /** Акцент (внутренняя линия, детали) */
  accent: string
  /** Заливка герба */
  emblem: string
  /** Щит на гербе */
  shield: string
  /** Лента / мелкий декор */
  ribbon: string
}

export const BACKGROUND_THEMES: BackgroundTheme[] = [
  {
    id: 'none',
    label: 'Без фона',
    paper: '#ffffff',
    frame: 'transparent',
    accent: 'transparent',
    emblem: 'transparent',
    shield: 'transparent',
    ribbon: 'transparent',
  },
  {
    id: 'classic',
    label: 'Классика (золото)',
    paper: '#fffdf6',
    frame: '#b8860b',
    accent: '#d4a84b',
    emblem: '#8b6914',
    shield: '#9b1c1c',
    ribbon: '#c45c26',
  },
  {
    id: 'imperial',
    label: 'Имперский (бордо)',
    paper: '#fff8f6',
    frame: '#7a1f2b',
    accent: '#c4a35a',
    emblem: '#5c1520',
    shield: '#1a3a6b',
    ribbon: '#b8860b',
  },
  {
    id: 'azure',
    label: 'Лазурь',
    paper: '#f7fbff',
    frame: '#1e4d8c',
    accent: '#5b8fc7',
    emblem: '#163a6b',
    shield: '#9b1c1c',
    ribbon: '#c4a35a',
  },
  {
    id: 'emerald',
    label: 'Изумруд',
    paper: '#f6fbf7',
    frame: '#1f6b4a',
    accent: '#3d9b6e',
    emblem: '#145238',
    shield: '#9b1c1c',
    ribbon: '#c4a35a',
  },
  {
    id: 'graphite',
    label: 'Графит',
    paper: '#f7f8fa',
    frame: '#4a5568',
    accent: '#8a94a6',
    emblem: '#2d3748',
    shield: '#1e3a5f',
    ribbon: '#718096',
  },
  {
    id: 'wine',
    label: 'Винный',
    paper: '#fff7f9',
    frame: '#6b2140',
    accent: '#a84d6d',
    emblem: '#4a1530',
    shield: '#1e3a5f',
    ribbon: '#c4a35a',
  },
]

export function getBackgroundTheme(id: string): BackgroundTheme {
  return (
    BACKGROUND_THEMES.find((theme) => theme.id === id) ?? BACKGROUND_THEMES[0]
  )
}
