import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { brand } from './brand'
import { formatEventDateTime } from './events'
import { getTicketCode } from './registrations'

type TicketPdfUser = {
  id: number
  event_id: number
  ticket_code?: string | null
  full_name: string
  title?: string | null
  email?: string | null
}

type TicketPdfEvent = {
  name: string
  date: string
  start_time?: string | null
  end_time?: string | null
  address?: string | null
}

const COLORS = {
  sidebar: [15, 92, 92] as const,
  white: [255, 255, 255] as const,
  muted: [100, 100, 100] as const,
  body: [28, 43, 43] as const,
  subtle: [80, 80, 80] as const,
  idText: [200, 200, 200] as const,
  line: [200, 200, 200] as const,
}

function drawLines(
  doc: jsPDF,
  lines: string | string[],
  x: number,
  y: number,
  lineHeight: number
): number {
  const textLines = Array.isArray(lines) ? lines : [lines]
  doc.text(textLines, x, y)
  return y + textLines.length * lineHeight
}

export async function createTicketPdf(
  user: TicketPdfUser,
  eventData: TicketPdfEvent
): Promise<jsPDF> {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const sidebarWidth = pageWidth * 0.32
  const contentX = sidebarWidth + 14
  const contentRight = pageWidth - 14
  const contentWidth = contentRight - contentX
  const columnGap = 10
  const columnWidth = (contentWidth - columnGap) / 2
  const locationX = contentX + columnWidth + columnGap

  doc.setFillColor(...COLORS.sidebar)
  doc.rect(0, 0, sidebarWidth, pageHeight, 'F')

  doc.setTextColor(...COLORS.white)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.text(brand.ticketLabel, 14, 18)

  try {
    const ticketCode = getTicketCode(user)
    const qrDataUrl = await QRCode.toDataURL(ticketCode, { margin: 2, width: 500 })
    const qrSize = 52
    const qrX = (sidebarWidth - qrSize) / 2
    const qrY = (pageHeight - qrSize) / 2 - 6
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize)

    doc.setFont('courier', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(...COLORS.idText)
    const idText = `ID: ${ticketCode}`.toUpperCase()
    doc.text(idText, (sidebarWidth - doc.getTextWidth(idText)) / 2, qrY + qrSize + 8)
  } catch (err) {
    console.error('QR Error', err)
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.muted)
  doc.text('OFFICIAL EVENT TICKET', contentX, 18)

  doc.setTextColor(...COLORS.body)
  doc.setFontSize(22)
  const eventNameLines = doc.splitTextToSize(eventData.name, contentWidth)
  let y = drawLines(doc, eventNameLines, contentX, 30, 9)

  doc.setDrawColor(...COLORS.line)
  doc.line(contentX, y + 2, contentRight, y + 2)
  y += 10

  doc.setFontSize(9)
  doc.setTextColor(...COLORS.muted)
  doc.text('ATTENDEE', contentX, y)

  doc.setFontSize(18)
  doc.setTextColor(...COLORS.body)
  y = drawLines(doc, user.full_name, contentX, y + 8, 7)

  if (user.title && user.title !== '-') {
    doc.setFontSize(11)
    doc.setTextColor(...COLORS.subtle)
    y = drawLines(doc, user.title.toUpperCase(), contentX, y + 1, 5)
  }

  if (user.email) {
    doc.setFontSize(10)
    doc.setTextColor(...COLORS.subtle)
    y = drawLines(doc, user.email, contentX, y + 2, 5)
  }

  y += 10
  const labelY = y

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(...COLORS.muted)
  doc.text('DATE', contentX, labelY)
  doc.text('LOCATION', locationX, labelY)

  const dateText = formatEventDateTime(
    eventData.date,
    eventData.start_time ?? null,
    eventData.end_time ?? null
  )
  const locationText = eventData.address?.trim() || '—'

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(...COLORS.body)

  const dateLines = doc.splitTextToSize(dateText, columnWidth)
  const locationLines = doc.splitTextToSize(locationText, columnWidth)
  const valueY = labelY + 6

  doc.text(dateLines, contentX, valueY)
  doc.text(locationLines, locationX, valueY)

  return doc
}
