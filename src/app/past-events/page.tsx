import { redirect } from 'next/navigation'

export default function PastEventsPage() {
  redirect('/?filter=past')
}
