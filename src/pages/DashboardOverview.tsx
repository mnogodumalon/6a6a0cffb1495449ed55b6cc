import { useState, useMemo, useCallback } from 'react';
import { useDashboardData } from '@/hooks/useDashboardData';
import { enrichFoerderantraege } from '@/lib/enrich';
import type { EnrichedFoerderantraege } from '@/types/enriched';
import type { Foerderantraege, Sachbearbeiter } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { LivingAppsService } from '@/services/livingAppsService';
import { lookupKey, formatDate, formatCurrency } from '@/lib/formatters';
import { DashboardSkeleton, DashboardError } from '@/components/DashboardStates';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { HeroBanner } from '@/components/HeroBanner';
import { KanbanWidget, type KanbanCard, type KanbanColumn, type KanbanTone } from '@/components/widgets/KanbanWidget';
import { ChartWidget, type ChartRow } from '@/components/widgets/ChartWidget';
import {
  RecordOverlayHost,
  RecordHeader,
  RecordAttachments,
  useRecordOverlayStack,
} from '@/components/widgets/RecordView';
import { FoerderantraegeDetails } from '@/components/details/FoerderantraegeDetails';
import { SachbearbeiterDetails } from '@/components/details/SachbearbeiterDetails';
import { FoerderantraegeDialog, type FoerderantraegeDialogDefaults } from '@/components/dialogs/FoerderantraegeDialog';
import { SachbearbeiterDialog } from '@/components/dialogs/SachbearbeiterDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { useClock, gruss, namen, undoToast } from '@/lib/polish';
import {
  IconAlertTriangle,
  IconPlus,
  IconFileText,
  IconArrowRight,
} from '@tabler/icons-react';
import { tx } from '@/i18n';

// ─── Kolumnen aus dem Schema ────────────────────────────────────────────────

function toneForStatus(status: string | undefined): KanbanTone {
  if (status === 'bewilligt') return 'success';
  if (status === 'in_bearbeitung') return 'primary';
  if (status === 'nachforderung') return 'warning';
  if (status === 'abgelehnt' || status === 'zurueckgezogen') return 'default';
  return 'warning'; // eingegangen → braucht Aufmerksamkeit
}

// ─── Overlay-Typen ──────────────────────────────────────────────────────────

type OverlayItem =
  | { type: 'foerderantrag'; id: string }
  | { type: 'sachbearbeiter'; id: string };

// ─── Hauptkomponente ────────────────────────────────────────────────────────

export default function DashboardOverview() {
  const COLUMNS: KanbanColumn[] = (LOOKUP_OPTIONS['foerderantraege']?.['antragsstatus'] ?? []).map(o => ({
  key: o.key,
  label: o.label,
}));

  const {
    sachbearbeiter, setSachbearbeiter,
    foerderantraege, setFoerderantraege,
    sachbearbeiterMap,
    loading, error, fetchAll,
  } = useDashboardData();

  const clock = useClock();

  const enrichedFoerderantraege = enrichFoerderantraege(foerderantraege, { sachbearbeiterMap });

  // ─── Dialog-State ─────────────────────────────────────────────────────────
  const [createAntragOpen, setCreateAntragOpen] = useState(false);
  const [createAntragDefaults, setCreateAntragDefaults] = useState<FoerderantraegeDialogDefaults | undefined>();
  const [editAntrag, setEditAntrag] = useState<EnrichedFoerderantraege | null>(null);
  const [createSBOpen, setCreateSBOpen] = useState(false);

  // ─── Overlay-Stack ────────────────────────────────────────────────────────
  const overlay = useRecordOverlayStack<OverlayItem>();

  // ─── Abgeleitete Zustände ─────────────────────────────────────────────────
  const nachforderung = useMemo(
    () => enrichedFoerderantraege.filter(r => lookupKey(r.fields.antragsstatus) === 'nachforderung'),
    [enrichedFoerderantraege],
  );

  const eingegangen = useMemo(
    () => enrichedFoerderantraege.filter(r => lookupKey(r.fields.antragsstatus) === 'eingegangen'),
    [enrichedFoerderantraege],
  );

  const ohneBearbeiter = useMemo(
    () => enrichedFoerderantraege.filter(
      r => !r.fields.bearbeiter && lookupKey(r.fields.antragsstatus) !== 'abgelehnt' && lookupKey(r.fields.antragsstatus) !== 'zurueckgezogen',
    ),
    [enrichedFoerderantraege],
  );

  // ─── Kanban-Karten ────────────────────────────────────────────────────────
  const cards = useMemo<KanbanCard[]>(
    () =>
      enrichedFoerderantraege.map(r => {
        const status = lookupKey(r.fields.antragsstatus) ?? COLUMNS[0]?.key ?? '';
        return {
          id: `antrag:${r.record_id}`,
          column: status,
          title: (r.fields.projekttitel ?? `${r.fields.antragsteller_vorname ?? ''} ${r.fields.antragsteller_nachname ?? ''}`.trim()) || tx('Ohne Titel'),
          subtitle: r.bearbeiterName
            ? `${r.bearbeiterName} · ${formatDate(r.fields.eingangsdatum)}`
            : formatDate(r.fields.eingangsdatum),
          tone: toneForStatus(status),
        };
      }),
    [enrichedFoerderantraege],
  );

  // ─── Status-Verschiebung (Kanban Drag) ───────────────────────────────────
  const moveCard = useCallback(
    async (cardId: string, newColumn: string) => {
      const rid = cardId.split(':')[1];
      if (!rid) return;
      const record = foerderantraege.find(r => r.record_id === rid);
      if (!record) return;
      const prevStatus = lookupKey(record.fields.antragsstatus) ?? '';
      // Optimistisch
      setFoerderantraege(prev =>
        prev.map(r =>
          r.record_id === rid
            ? { ...r, fields: { ...r.fields, antragsstatus: { key: newColumn, label: newColumn } } }
            : r,
        ),
      );
      const columnLabel = COLUMNS.find(c => c.key === newColumn)?.label ?? newColumn;
      undoToast(tx`Status geändert zu „${columnLabel}"`, async () => {
        setFoerderantraege(prev =>
          prev.map(r =>
            r.record_id === rid
              ? { ...r, fields: { ...r.fields, antragsstatus: { key: prevStatus, label: prevStatus } } }
              : r,
          ),
        );
        try {
          await LivingAppsService.updateFoerderantraegeEntry(rid, { antragsstatus: prevStatus });
        } catch {
          await fetchAll();
        }
      });
      try {
        await LivingAppsService.updateFoerderantraegeEntry(rid, { antragsstatus: newColumn });
      } catch {
        await fetchAll();
      }
    },
    [foerderantraege, setFoerderantraege, fetchAll],
  );

  // ─── Status-Advance-Helper ────────────────────────────────────────────────
  const advanceStatus = useCallback(
    async (record: Foerderantraege | EnrichedFoerderantraege) => {
      const current = lookupKey(record.fields.antragsstatus) ?? 'eingegangen';
      const statusFlow: Record<string, string> = {
        eingegangen: 'in_bearbeitung',
        in_bearbeitung: 'bewilligt',
        nachforderung: 'in_bearbeitung',
      };
      const next = statusFlow[current];
      if (!next) return;
      const prevStatus = current;
      setFoerderantraege(prev =>
        prev.map(r =>
          r.record_id === record.record_id
            ? { ...r, fields: { ...r.fields, antragsstatus: { key: next, label: next } } }
            : r,
        ),
      );
      const nextLabel = COLUMNS.find(c => c.key === next)?.label ?? next;
      undoToast(tx`Status → „${nextLabel}" gesetzt`, async () => {
        setFoerderantraege(prev =>
          prev.map(r =>
            r.record_id === record.record_id
              ? { ...r, fields: { ...r.fields, antragsstatus: { key: prevStatus, label: prevStatus } } }
              : r,
          ),
        );
        try {
          await LivingAppsService.updateFoerderantraegeEntry(record.record_id, { antragsstatus: prevStatus });
        } catch {
          await fetchAll();
        }
      });
      try {
        await LivingAppsService.updateFoerderantraegeEntry(record.record_id, { antragsstatus: next });
      } catch {
        await fetchAll();
      }
    },
    [setFoerderantraege, fetchAll],
  );

  // ─── Loading / Error ──────────────────────────────────────────────────────
  if (loading) return <DashboardSkeleton />;
  if (error) return <DashboardError error={error} onRetry={fetchAll} />;

  // ─── Kontext-Satz ─────────────────────────────────────────────────────────
  const neuesteAntraege = [...enrichedFoerderantraege]
    .sort((a, b) => (b.createdat ?? '').localeCompare(a.createdat ?? ''))
    .slice(0, 3);
  const namensListe = neuesteAntraege.map(r =>
    r.fields.projekttitel ?? `${r.fields.antragsteller_vorname ?? ''} ${r.fields.antragsteller_nachname ?? ''}`.trim()
  );
  const kontextSatz =
    foerderantraege.length === 0
      ? tx('Noch keine Förderanträge vorhanden — lege jetzt den ersten an.')
      : nachforderung.length > 0
        ? tx`${nachforderung.length} ${nachforderung.length === 1 ? tx('Antrag wartet') : tx('Anträge warten')} auf Nachbesserung.`
        : namensListe.length > 0
          ? tx`Zuletzt eingegangen: ${namen(namensListe)}.`
          : tx`${foerderantraege.length} Anträge in der Verwaltung.`;

  // ─── Kein-Inhalt-Zustand ──────────────────────────────────────────────────
  if (foerderantraege.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">{gruss(clock)} {tx('Förderantragsverwaltung')}</h1>
          <p className="text-muted-foreground mt-1">{tx('Richte deine Förderantragsverwaltung ein.')}</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 gap-4">
          <IconFileText size={48} className="text-muted-foreground" stroke={1.5} />
          <p className="text-muted-foreground text-center max-w-sm">
            {tx('Noch kein Förderantrag vorhanden. Lege jetzt den ersten an und verwalte die gesamte Pipeline hier.')}
          </p>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            onClick={() => { setCreateAntragDefaults(undefined); setCreateAntragOpen(true); }}
          >
            <IconPlus size={16} className="shrink-0" />
            {tx('Ersten Antrag aufnehmen')}
          </button>
        </div>
        <FoerderantraegeDialog
          open={createAntragOpen}
          onClose={() => setCreateAntragOpen(false)}
          onSubmit={async fields => {
            await LivingAppsService.createFoerderantraegeEntry(fields);
            await fetchAll();
          }}
          defaultValues={createAntragDefaults}
          sachbearbeiterList={sachbearbeiter}
          enablePhotoScan={AI_PHOTO_SCAN['Foerderantraege']}
          enablePhotoLocation={AI_PHOTO_LOCATION['Foerderantraege']}
        />
      </div>
    );
  }

  // ─── Chart-Daten ──────────────────────────────────────────────────────────
  type AntragRow = ChartRow<EnrichedFoerderantraege>;
  const chartRows: AntragRow[] = enrichedFoerderantraege.map(r => ({
    id: `antrag:${r.record_id}`,
    data: r,
  }));

  // ─── Hero ─────────────────────────────────────────────────────────────────
  const heroElement = nachforderung.length > 0 && (
    <HeroBanner
      icon={<IconAlertTriangle size={18} />}
      action={{
        label: tx('In Bearbeitung setzen'),
        onClick: () => void advanceStatus(nachforderung[0]),
      }}
    >
      <b>{namen(nachforderung.map(r => r.fields.projekttitel ?? `${r.fields.antragsteller_vorname ?? ''} ${r.fields.antragsteller_nachname ?? ''}`.trim()))}</b>
      {' '}{nachforderung.length === 1 ? 'wartet' : 'warten'} {tx('auf Nachbesserung durch den Antragsteller.')}
    </HeroBanner>
  );

  // ─── Aside-Inhalt ─────────────────────────────────────────────────────────
  const asideContent = (
    <>
      <WorkList
        title={tx('Neu eingegangen')}
        items={eingegangen.slice(0, 5).map(r => ({
          id: r.record_id,
          title: (r.fields.projekttitel ?? `${r.fields.antragsteller_vorname ?? ''} ${r.fields.antragsteller_nachname ?? ''}`.trim()) || tx('Ohne Titel'),
          secondLine: (
            <span className="text-muted-foreground text-xs">
              {formatDate(r.fields.eingangsdatum)}
              {r.bearbeiterName && <> · <span className="font-medium">{r.bearbeiterName}</span></>}
            </span>
          ),
          action: {
            label: <span className="flex items-center gap-1 text-xs"><IconArrowRight size={12} className="shrink-0" />{tx('Bearbeiten')}</span>,
            onClick: () => void advanceStatus(r),
          },
        }))}
        onItemClick={id => overlay.replace({ type: 'foerderantrag', id })}
        empty={{
          text: tx('Alle neuen Anträge wurden aufgenommen.'),
          action: {
            label: tx('Neuen Antrag aufnehmen'),
            onClick: () => { setCreateAntragDefaults({ antragsstatus: 'eingegangen' }); setCreateAntragOpen(true); },
          },
        }}
      />

      <ChartWidget
        title={tx('Anträge nach Kategorie')}
        rows={chartRows}
        dimension={{
          kind: 'category',
          accessor: r => r.data.fields.foerderkategorie?.label ?? null,
        }}
      />
    </>
  );

  // ─── Förderbetrag-KPI ─────────────────────────────────────────────────────
  const bewilligteAntraege = enrichedFoerderantraege.filter(r => lookupKey(r.fields.antragsstatus) === 'bewilligt');
  const bewilligterBetrag = bewilligteAntraege.reduce((sum, r) => sum + (r.fields.beantragter_foerderbetrag ?? 0), 0);
  const offeneAntraege = enrichedFoerderantraege.filter(
    r => !['abgelehnt', 'zurueckgezogen', 'bewilligt'].includes(lookupKey(r.fields.antragsstatus) ?? ''),
  );

  return (
    <>
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold">{gruss(clock)} {tx('Förderantragsverwaltung')}</h1>
            <p className="text-muted-foreground mt-1">{kontextSatz}</p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 shrink-0"
            onClick={() => { setCreateAntragDefaults(undefined); setCreateAntragOpen(true); }}
          >
            <IconPlus size={16} className="shrink-0" />
            {tx('Neuer Antrag')}
          </button>
        </div>
      </div>

      <DashboardGrid
        variant="wide"
        hero={heroElement || undefined}
        kpis={
          <StatStrip>
            <StatStripItem
              title={tx('Offen')}
              value={offeneAntraege.length}
              tone={offeneAntraege.length > 0 ? 'primary' : 'default'}
            />
            <StatStripItem
              title={tx('Nachforderung')}
              value={nachforderung.length}
              tone={nachforderung.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Ohne Sachbearbeiter')}
              value={ohneBearbeiter.length}
              tone={ohneBearbeiter.length > 0 ? 'warning' : 'default'}
            />
            <StatStripItem
              title={tx('Bewilligter Betrag')}
              value={formatCurrency(bewilligterBetrag)}
              tone="success"
            />
          </StatStrip>
        }
        primary={
          <KanbanWidget
            cards={cards}
            columns={COLUMNS}
            defaultCollapsed={['abgelehnt', 'zurueckgezogen']}
            onCardClick={card => overlay.replace({ type: 'foerderantrag', id: card.id.split(':')[1] ?? '' })}
            onCardMove={moveCard}
            onAddCard={column => {
              setCreateAntragDefaults({ antragsstatus: column });
              setCreateAntragOpen(true);
            }}
          />
        }
        aside={asideContent}
      />

      {/* ─── Dialoge ─────────────────────────────────────────────────────── */}
      <FoerderantraegeDialog
        open={createAntragOpen || editAntrag !== null}
        onClose={() => { setCreateAntragOpen(false); setEditAntrag(null); }}
        onSubmit={async fields => {
          if (editAntrag) {
            await LivingAppsService.updateFoerderantraegeEntry(editAntrag.record_id, fields);
          } else {
            await LivingAppsService.createFoerderantraegeEntry(fields);
          }
          await fetchAll();
        }}
        defaultValues={editAntrag?.fields ?? createAntragDefaults}
        recordId={editAntrag?.record_id}
        sachbearbeiterList={sachbearbeiter}
        enablePhotoScan={AI_PHOTO_SCAN['Foerderantraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Foerderantraege']}
      />

      <SachbearbeiterDialog
        open={createSBOpen}
        onClose={() => setCreateSBOpen(false)}
        onSubmit={async fields => {
          await LivingAppsService.createSachbearbeiterEntry(fields);
          await fetchAll();
        }}
        enablePhotoScan={AI_PHOTO_SCAN['Sachbearbeiter']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Sachbearbeiter']}
      />

      {/* ─── Overlay-Stack ───────────────────────────────────────────────── */}
      <RecordOverlayHost
        overlay={overlay}
        render={top => {
          if (top.type === 'foerderantrag') {
            const record = foerderantraege.find(r => r.record_id === top.id);
            if (!record) return null;
            return (
              <>
                <RecordHeader
                  title={(record.fields.projekttitel ?? `${record.fields.antragsteller_vorname ?? ''} ${record.fields.antragsteller_nachname ?? ''}`.trim()) || tx('Ohne Titel')}
                  subtitle={record.fields.antragsstatus?.label}
                />
                <FoerderantraegeDetails
                  record={record}
                  sachbearbeiterList={sachbearbeiter}
                  onOpenSachbearbeiter={sb => overlay.push({ type: 'sachbearbeiter', id: sb.record_id })}
                />
              </>
            );
          }
          if (top.type === 'sachbearbeiter') {
            const record = sachbearbeiter.find(r => r.record_id === top.id);
            if (!record) return null;
            return (
              <>
                <RecordHeader
                  title={`${record.fields.vorname ?? ''} ${record.fields.nachname ?? ''}`.trim() || tx('Sachbearbeiter')}
                  subtitle={record.fields.funktion ?? record.fields.abteilung}
                />
                <SachbearbeiterDetails
                  record={record}
                  foerderantraegeList={foerderantraege}
                  onOpenFoerderantraege={r => overlay.push({ type: 'foerderantrag', id: r.record_id })}
                  onAddFoerderantraege={() => {
                    setCreateAntragDefaults({ bearbeiter: record.record_id });
                    setCreateAntragOpen(true);
                  }}
                />
              </>
            );
          }
          return null;
        }}
        onEdit={top => {
          if (top.type === 'foerderantrag') {
            const record = enrichedFoerderantraege.find(r => r.record_id === top.id);
            if (record) { setEditAntrag(record); overlay.close(); }
          }
        }}
        footer={top => {
          if (top.type === 'foerderantrag') {
            const record = foerderantraege.find(r => r.record_id === top.id);
            if (!record) return null;
            const current = lookupKey(record.fields.antragsstatus) ?? 'eingegangen';
            const statusFlow: Record<string, string> = {
              eingegangen: 'in_bearbeitung',
              in_bearbeitung: 'bewilligt',
              nachforderung: 'in_bearbeitung',
            };
            const next = statusFlow[current];
            if (!next) return null;
            const nextLabel = COLUMNS.find(c => c.key === next)?.label ?? next;
            return { label: `→ ${nextLabel}`, onClick: () => { void advanceStatus(record); overlay.close(); } };
          }
          return null;
        }}
      />
    </>
  );
}
