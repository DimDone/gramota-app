// Выгрузка документов списка в PDF (по файлу на документ или один многостраничный).

import { createRoot, type Root } from 'react-dom/client'
import { createElement } from 'react'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import { CertificateSheet } from './CertificateSheet'
import { pageSizeMm } from './pageGeometry'
import type { Certificate, SharedCertificateParams } from './types'
import './CertificatePreview.css'

const PDF_MIME = 'application/pdf'
const FALLBACK_PDF_NAME = 'Грамоты.pdf'

export type ExportPdfResult =
  | { ok: true; count: number }
  | { ok: false; reason: 'cancelled' | 'error' }

/** Выгружает каждый документ списка отдельным PDF в выбранную папку (или один PDF — fallback). */
export async function exportCertificatesPdf(
  shared: SharedCertificateParams,
  certificates: Certificate[],
): Promise<ExportPdfResult> {
  if (certificates.length === 0) {
    return { ok: false, reason: 'error' }
  }

  try {
    const pages = await renderCertificateCanvases(shared, certificates)
    const { widthMm, heightMm } = pageSizeMm(shared.orientation)

    const dirPicker = window.showDirectoryPicker
    if (dirPicker) {
      try {
        const directory = await dirPicker({ mode: 'readwrite' })
        const usedNames = new Set<string>()

        for (let i = 0; i < certificates.length; i++) {
          const pdf = canvasToPdf(pages[i], widthMm, heightMm)
          const blob = pdf.output('blob')
          const fileName = uniquePdfFileName(certificates[i].name, usedNames)
          const handle = await directory.getFileHandle(fileName, {
            create: true,
          })
          const writable = await handle.createWritable()
          await writable.write(blob)
          await writable.close()
        }

        return { ok: true, count: certificates.length }
      } catch (error) {
        if (isAbortError(error)) return { ok: false, reason: 'cancelled' }
        // fallback: один многостраничный PDF
      }
    }

    const pdf = new jsPDF({
      orientation: shared.orientation === 'portrait' ? 'portrait' : 'landscape',
      unit: 'mm',
      format: 'a4',
    })

    for (let i = 0; i < pages.length; i++) {
      if (i > 0) pdf.addPage('a4', shared.orientation === 'portrait' ? 'p' : 'l')
      const dataUrl = pages[i].toDataURL('image/jpeg', 0.95)
      pdf.addImage(dataUrl, 'JPEG', 0, 0, widthMm, heightMm)
    }

    await savePdfBlob(pdf.output('blob'), FALLBACK_PDF_NAME)
    return { ok: true, count: certificates.length }
  } catch {
    return { ok: false, reason: 'error' }
  }
}

async function renderCertificateCanvases(
  shared: SharedCertificateParams,
  certificates: Certificate[],
): Promise<HTMLCanvasElement[]> {
  const host = document.createElement('div')
  host.setAttribute('aria-hidden', 'true')
  host.style.cssText =
    'position:fixed;left:-10000px;top:0;pointer-events:none;z-index:-1;'
  document.body.appendChild(host)

  const root: Root = createRoot(host)
  const canvases: HTMLCanvasElement[] = []

  try {
    for (const certificate of certificates) {
      await renderSheet(root, shared, certificate)
      const sheet = host.querySelector<HTMLElement>('[data-certificate-sheet]')
      if (!sheet) throw new Error('Sheet not rendered')

      // Дождаться шрифтов/layout перед снимком
      await document.fonts.ready
      await nextFrame()
      await nextFrame()

      const canvas = await html2canvas(sheet, {
        backgroundColor: '#ffffff',
        scale: 1,
        useCORS: true,
        logging: false,
      })
      canvases.push(canvas)
    }
  } finally {
    root.unmount()
    host.remove()
  }

  return canvases
}

function renderSheet(
  root: Root,
  shared: SharedCertificateParams,
  certificate: Certificate,
): Promise<void> {
  return new Promise((resolve) => {
    root.render(
      createElement(CertificateSheet, {
        params: shared,
        certificate,
        exportMode: true,
      }),
    )
    // commit + layout
    queueMicrotask(() => resolve())
  })
}

function canvasToPdf(
  canvas: HTMLCanvasElement,
  widthMm: number,
  heightMm: number,
): jsPDF {
  const pdf = new jsPDF({
    orientation: widthMm > heightMm ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4',
  })
  const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
  pdf.addImage(dataUrl, 'JPEG', 0, 0, widthMm, heightMm)
  return pdf
}

function uniquePdfFileName(rawName: string, used: Set<string>): string {
  const base = sanitizeFileName(rawName) || 'Документ'
  let name = `${base}.pdf`
  let index = 2
  while (used.has(name.toLowerCase())) {
    name = `${base} (${index}).pdf`
    index += 1
  }
  used.add(name.toLowerCase())
  return name
}

function sanitizeFileName(value: string): string {
  return value
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
}

async function savePdfBlob(blob: Blob, fileName: string): Promise<void> {
  const savePicker = window.showSaveFilePicker
  if (savePicker) {
    try {
      const handle = await savePicker({
        suggestedName: fileName,
        types: [
          {
            description: 'PDF',
            accept: { [PDF_MIME]: ['.pdf'] },
          },
        ],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (error) {
      if (isAbortError(error)) throw error
    }
  }

  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  URL.revokeObjectURL(url)
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name: string }).name === 'AbortError'
  )
}

declare global {
  interface Window {
    showDirectoryPicker?: (options?: {
      mode?: 'read' | 'readwrite'
    }) => Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemDirectoryHandle {
    getFileHandle(
      name: string,
      options?: { create?: boolean },
    ): Promise<FileSystemFileHandle>
  }
}
