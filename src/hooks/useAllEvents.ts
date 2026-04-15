// Fetches upcoming library events (next 7 days) across all branches for the What's On feed.
import { useEffect, useState } from 'react'
import { CKAN_BASE_URL, EVENTS_RESOURCE_ID, MS_PER_DAY } from '../constants'
import { sortedBranches } from '../composables/useRegion'
import type { Branch } from '@tpl-passport/shared'

export interface AggregatedEvent {
  id: number | string
  title: string
  date: string         // YYYY-MM-DD
  time: string         // HH:MM:SS or ''
  audiences: string
  locationName: string
  branch: Branch | null
}

interface RawEvent {
  _id: number | string
  EventName?: string
  'Event Name'?: string
  Title?: string
  StartDateLocal: string
  StartTime?: string
  Audiences?: string
  AgeGroup?: string
  'Age Group'?: string
  LocationName?: string
  Location?: string
}

// Name → branch lookup, stripping " Branch" suffix to match CKAN LocationName values.
const branchByShortName = new Map<string, Branch>()
for (const b of sortedBranches) {
  branchByShortName.set(b.BranchName.replace(/ Branch$/i, '').toLowerCase(), b)
}

function normalize(raw: RawEvent): AggregatedEvent {
  const locationName = raw.LocationName ?? raw.Location ?? ''
  return {
    id: raw._id,
    title: raw.EventName ?? raw['Event Name'] ?? raw.Title ?? 'Event',
    date: raw.StartDateLocal,
    time: raw.StartTime ?? '',
    audiences: raw.Audiences ?? raw.AgeGroup ?? raw['Age Group'] ?? '',
    locationName,
    branch: branchByShortName.get(locationName.toLowerCase()) ?? null,
  }
}

export function useAllEvents(): { events: AggregatedEvent[]; loading: boolean } {
  const [events, setEvents] = useState<AggregatedEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const ac = new AbortController()
    const today = new Date().toISOString().slice(0, 10)
    const cutoff = new Date(Date.now() + 7 * MS_PER_DAY).toISOString().slice(0, 10)
    const url = `${CKAN_BASE_URL}/datastore_search?id=${EVENTS_RESOURCE_ID}&limit=500&sort=StartDateLocal%20asc`

    fetch(url, { signal: ac.signal })
      .then(r => r.json())
      .then(data => {
        const records: RawEvent[] = data.result?.records ?? []
        const filtered = records
          .filter(e => e.StartDateLocal >= today && e.StartDateLocal <= cutoff)
          .sort((a, b) => {
            if (a.StartDateLocal !== b.StartDateLocal) return a.StartDateLocal < b.StartDateLocal ? -1 : 1
            return (a.StartTime ?? '') < (b.StartTime ?? '') ? -1 : 1
          })
        setEvents(filtered.map(normalize))
      })
      .catch(err => { if (!(err instanceof Error && err.name === 'AbortError')) setEvents([]) })
      .finally(() => setLoading(false))

    return () => ac.abort()
  }, [])

  return { events, loading }
}
