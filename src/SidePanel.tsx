// Боковая панель (слева — список, справа — параметры) с заголовком.

import type { ReactNode } from 'react'
import './SidePanel.css'

type SidePanelProps = {
  side: 'left' | 'right'
  title: string
  children: ReactNode
}

export function SidePanel({ side, title, children }: SidePanelProps) {
  return (
    <aside
      className={`side-panel side-panel--${side}`}
      data-side={side}
      aria-label={title}
    >
      <header className="side-panel__header">
        <h2 className="side-panel__title">{title}</h2>
      </header>
      <div className="side-panel__body">{children}</div>
    </aside>
  )
}
