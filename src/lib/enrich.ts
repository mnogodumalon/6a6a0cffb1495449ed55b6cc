import type { EnrichedFoerderantraege } from '@/types/enriched';
import type { Foerderantraege, Sachbearbeiter } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveDisplay(url: unknown, map: Map<string, any>, ...fields: string[]): string {
  if (!url) return '';
  const id = extractRecordId(url);
  if (!id) return '';
  const r = map.get(id);
  if (!r) return '';
  return fields.map(f => String(r.fields[f] ?? '')).join(' ').trim();
}

interface FoerderantraegeMaps {
  sachbearbeiterMap: Map<string, Sachbearbeiter>;
}

export function enrichFoerderantraege(
  foerderantraege: Foerderantraege[],
  maps: FoerderantraegeMaps
): EnrichedFoerderantraege[] {
  return foerderantraege.map(r => ({
    ...r,
    bearbeiterName: resolveDisplay(r.fields.bearbeiter, maps.sachbearbeiterMap, 'vorname', 'nachname'),
  }));
}
