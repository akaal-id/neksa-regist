import XLSX from 'xlsx'
import { writeFileSync } from 'fs'

const ADDRESS = 'Senayan Tennis Indoor (2nd Floor)'

function excelDateToISO(serial) {
  const num = typeof serial === 'number' ? serial : Number(String(serial).trim())
  if (!num || Number.isNaN(num)) return null
  const d = XLSX.SSF.parse_date_code(num)
  if (!d) return null
  return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`
}

function parseTimeRange(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null
  const s = timeStr.trim().replace(/[–—]/g, '-')
  if (!s || s === '-') return null
  const m = s.match(/(\d{1,2})[.:](\d{2})\s*-\s*(\d{1,2})[.:](\d{2})/)
  if (!m) return null
  return {
    start: `${String(m[1]).padStart(2, '0')}:${m[2]}:00`,
    end: `${String(m[3]).padStart(2, '0')}:${m[4]}:00`,
  }
}

function slugify(name, index) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return base || `hei-talk-${index}`
}

function isSkip(text) {
  const t = text.trim().toUpperCase()
  if (!t) return true
  if (t === 'NOT AVAILABLE') return true
  if (t.startsWith('BREAK')) return true
  if (t === 'JUMMAAH PRAY') return true
  if (t.startsWith('PROPOSED SPEAKER')) return true
  return false
}

function cleanTitle(text) {
  let t = text.trim().replace(/\s+/g, ' ')
  if (t.startsWith('Topic:')) {
    t = t.replace(/^Topic:\s*/i, '').replace(/^["']|["']$/g, '')
  }
  return t
}

const wb = XLSX.readFile('c:/Users/Indra/Downloads/HEI Program_rlsd.xlsx')
const ws = wb.Sheets['GRAND SCHEDULE']
const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })

let currentDate = null
const events = []
const slugCounts = new Map()

for (let i = 0; i < data.length; i++) {
  const row = data[i]
  const dateSerial = row[2]
  const time = row[3]
  const heiTalk = row[4]

  if (dateSerial) {
    const iso = excelDateToISO(dateSerial)
    if (iso) currentDate = iso
  }

  if (!currentDate || !heiTalk || typeof heiTalk !== 'string') continue
  if (isSkip(heiTalk)) continue

  const times = parseTimeRange(time)
  if (!times) continue

  const title = cleanTitle(heiTalk.split('\n')[0])
  if (!title || title.length < 3) continue

  const description = heiTalk.trim()

  let slug = slugify(title, events.length + 1)
  const count = slugCounts.get(slug) ?? 0
  slugCounts.set(slug, count + 1)
  if (count > 0) slug = `${slug}-${count + 1}`

  events.push({
    name: title.length > 150 ? `${title.slice(0, 147)}...` : title,
    description,
    date: currentDate,
    start_time: times.start,
    end_time: times.end,
    address: ADDRESS,
    slug,
    source_row: i + 1,
  })
}

console.log(`Parsed ${events.length} HEI Talk events`)
events.forEach((e, idx) => {
  console.log(`${idx + 1}. [${e.date} ${e.start_time}-${e.end_time}] ${e.name}`)
})

writeFileSync('scripts/hei-talk-events.json', JSON.stringify(events, null, 2))
console.log('\nWrote scripts/hei-talk-events.json')
