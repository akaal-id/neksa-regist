import { readFileSync, writeFileSync } from 'fs'

function slugify(name) {
  return name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')
}

function sqlEscape(value) {
  return String(value).replace(/'/g, "''")
}

function buildDescription(event) {
  const items = event.speakers.map((s) => `<li>${s}</li>`).join('')
  let html = `<p><strong>Speakers:</strong></p><ol>${items}</ol>`
  if (event.moderator) {
    html += `<p><strong>Moderator:</strong> ${event.moderator}</p>`
  }
  return html
}

function uniqueSlug(name, used) {
  let base = slugify(name).slice(0, 60).replace(/-+$/, '')
  let slug = base
  let n = 2
  while (used.has(slug)) {
    slug = `${base}-${n}`
    n += 1
  }
  used.add(slug)
  return slug
}

const events = JSON.parse(readFileSync('scripts/hei-talk-events.json', 'utf8'))
const usedSlugs = new Set()

const values = events.map((event) => {
  const name = sqlEscape(event.name)
  const description = sqlEscape(buildDescription(event))
  const address = sqlEscape(event.address)
  const slug = sqlEscape(event.slug ?? uniqueSlug(event.name, usedSlugs))
  return `  ('${name}', '${description}', '${event.date}', '${event.start_time}', '${event.end_time}', '${address}', '${slug}', 20)`
})

const sql = `-- HEI Talk sessions updated from official schedule (Jul 2026)
DELETE FROM public.registrations;
DELETE FROM public.events;

SELECT setval(pg_get_serial_sequence('public.events', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.registrations', 'id'), 1, false);

INSERT INTO public.events (name, description, date, start_time, end_time, address, slug, capacity)
VALUES
${values.join(',\n')};
`

const outPath = 'scripts/hei-talk-update.sql'
writeFileSync(outPath, sql)
console.log(`Wrote ${outPath} with ${events.length} events`)
