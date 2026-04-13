import { useEffect, useState } from 'react'
import { CKAN_BASE_URL, EVENTS_RESOURCE_ID, MS_PER_DAY } from '../constants'

// Raw shape returned by CKAN — field names vary across dataset versions.
interface RawCkanEvent {
  _id: number | string
  EventName?: string
  'Event Name'?: string
  Title?: string
  StartDateLocal: string
  StartTime?: string
  Audiences?: string
  AgeGroup?: string
  'Age Group'?: string
}

// Normalized shape consumed by EventsSection.
export interface BranchEvent {
  id: number | string
  title: string
  date: string   // YYYY-MM-DD
  time: string   // HH:MM:SS or empty
  audiences: string
}

function normalize(raw: RawCkanEvent): BranchEvent {
  return {
    id: raw._id,
    title: raw.EventName ?? raw['Event Name'] ?? raw.Title ?? 'Event',
    date: raw.StartDateLocal,
    time: raw.StartTime ?? '',
    audiences: raw.Audiences ?? raw.AgeGroup ?? raw['Age Group'] ?? '',
  }
}

function filterToWindow(records: RawCkanEvent[]): RawCkanEvent[] {
  const today = new Date().toISOString().slice(0, 10)
  const tomorrow = new Date(Date.now() + MS_PER_DAY).toISOString().slice(0, 10)
  return records
    .filter(e => e.StartDateLocal >= today && e.StartDateLocal <= tomorrow)
    .sort((a, b) => (a.StartDateLocal < b.StartDateLocal ? -1 : 1))
}

export function useEventsForBranch(branchName: string): { events: BranchEvent[]; loading: boolean } {
  const [events, setEvents] = useState<BranchEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ac = new AbortController()
    const shortName = branchName.replace(/ Branch$/i, '')
    const filters = JSON.stringify({ LocationName: shortName })
    const url = `${CKAN_BASE_URL}/datastore_search?id=${EVENTS_RESOURCE_ID}&filters=${encodeURIComponent(filters)}&limit=100&sort=StartDateLocal%20desc`
    fetch(url, { signal: ac.signal })
      .then(r => r.json())
      .then(data => setEvents(filterToWindow(data.result?.records ?? []).map(normalize)))
      .catch(err => { if (!(err instanceof Error && err.name === 'AbortError')) setEvents([]) })
      .finally(() => setLoading(false))
    return () => ac.abort()
  }, [branchName])

  return { events, loading }
}
