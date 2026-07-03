import { readFileSync, writeFileSync } from 'fs'

const events = JSON.parse(readFileSync('scripts/hei-talk-events.json', 'utf8'))

function sqlEscape(value) {
  return String(value).replace(/'/g, "''")
}

const values = events.map((event) => {
  const name = sqlEscape(event.name)
  const description = sqlEscape(event.description)
  const address = sqlEscape(event.address)
  const slug = sqlEscape(event.slug)
  return `  ('${name}', '${description}', '${event.date}', '${event.start_time}', '${event.end_time}', '${address}', '${slug}')`
})

const sql = `-- Replace mock events with HEI Talk sessions from HEI Program schedule (column E)
DELETE FROM public.registrations;
DELETE FROM public.events;

SELECT setval(pg_get_serial_sequence('public.events', 'id'), 1, false);
SELECT setval(pg_get_serial_sequence('public.registrations', 'id'), 1, false);

INSERT INTO public.events (name, description, date, start_time, end_time, address, slug)
VALUES
${values.join(',\n')};
`

writeFileSync('supabase/migrations/20260703170000_seed_hei_talk_events.sql', sql)
console.log(`Wrote migration with ${events.length} events`)
