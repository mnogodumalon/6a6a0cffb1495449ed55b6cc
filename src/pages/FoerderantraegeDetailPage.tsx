import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LivingAppsService, extractRecordId } from '@/services/livingAppsService';
import type { Foerderantraege, Sachbearbeiter } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { Button } from '@/components/ui/button';
import { IconArrowLeft, IconTrash } from '@tabler/icons-react';
import {
  RecordView, RecordHeader, RecordKeyFacts, RecordSection, RecordField,
  RecordAttachments, RecordViewSkeleton, RecordViewEmpty,
} from '@/components/widgets/RecordView';
import { FoerderantraegeDialog } from '@/components/dialogs/FoerderantraegeDialog';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AI_PHOTO_SCAN, AI_PHOTO_LOCATION } from '@/config/ai-features';
import { formEnhancements } from '@/config/form-enhancements/Foerderantraege';
import { evalComputed } from '@/config/form-enhancements/types';

export default function FoerderantraegeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [record, setRecord] = useState<Foerderantraege | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [sachbearbeiterList, setSachbearbeiterList] = useState<Sachbearbeiter[]>([]);

  useEffect(() => { loadData(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const [mainData, sachbearbeiterData] = await Promise.all([
        LivingAppsService.getFoerderantraege(),
        LivingAppsService.getSachbearbeiter(),
      ]);
      setSachbearbeiterList(sachbearbeiterData);
      setRecord(mainData.find(r => r.record_id === id) ?? null);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(fields: Foerderantraege['fields']) {
    if (!record) return;
    await LivingAppsService.updateFoerderantraegeEntry(record.record_id, fields);
    await loadData();
    setEditing(false);
  }

  async function handleDelete() {
    if (!record) return;
    await LivingAppsService.deleteFoerderantraegeEntry(record.record_id);
    setDeleteOpen(false);
    navigate('/foerderantraege');
  }

  function getSachbearbeiterDisplayName(url?: unknown) {
    if (!url) return '—';
    const refId = extractRecordId(url);
    return sachbearbeiterList.find(r => r.record_id === refId)?.fields.vorname ?? '—';
  }

  if (loading) {
    return <RecordViewSkeleton />;
  }

  if (!record) {
    return (
      <RecordViewEmpty
        title="Eintrag nicht gefunden"
        action={
          <Button variant="ghost" onClick={() => navigate('/foerderantraege')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            Zurück
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/foerderantraege')}
      onEdit={() => setEditing(true)}
      backLabel="Zurück"
      editLabel="Bearbeiten"
    >
      <RecordHeader title={record.fields.antragsteller_vorname ?? 'Förderanträge'} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
          bearbeiter: sachbearbeiterList,
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString('de-DE', { maximumFractionDigits: 2 });
        const computedFacts = Object.entries(formEnhancements.computed)
          .map(([key, formula]) => {
            const v = evalComputed(formula, record!.fields as Record<string, unknown>, { lookupLists });
            return v != null
              ? { label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '), value: fmtComputed(key, v) }
              : null;
          })
          .filter((f): f is { label: string; value: string } => f !== null);
        return computedFacts.length > 0 ? <RecordKeyFacts items={computedFacts} /> : null;
      })()}

      <RecordSection title="Details" cols={2}>
        <RecordField label="Anrede" value={record.fields.anrede} format="pill" />
        <RecordField label="Vorname" value={record.fields.antragsteller_vorname} format="text" />
        <RecordField label="Nachname" value={record.fields.antragsteller_nachname} format="text" />
        <RecordField label="Organisation / Institution" value={record.fields.organisation} format="text" />
        <RecordField label="Rechtsform" value={record.fields.rechtsform} format="pill" />
        <RecordField label="Straße" value={record.fields.strasse} format="text" />
        <RecordField label="Hausnummer" value={record.fields.hausnummer} format="text" />
        <RecordField label="Postleitzahl" value={record.fields.plz} format="text" />
        <RecordField label="Ort" value={record.fields.ort} format="text" />
        <RecordField label="Land" value={record.fields.land} format="text" />
        <RecordField label="E-Mail-Adresse des Antragstellers" value={record.fields.antragsteller_email} format="email" />
        <RecordField label="Telefonnummer des Antragstellers" value={record.fields.antragsteller_telefon} format="text" />
        <RecordField label="Website des Antragstellers" value={record.fields.antragsteller_website} format="url" />
        <RecordField label="Projekttitel" value={record.fields.projekttitel} format="text" />
        <RecordField label="Kurzbeschreibung des Projekts" value={record.fields.projektkurzbeschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label="Projektbeginn" value={record.fields.projektbeginn} format="date" />
        <RecordField label="Projektende" value={record.fields.projektende} format="date" />
        <RecordField label="Projektort" value={record.fields.projektort} format="text" />
        <RecordField label="Förderprogramm" value={record.fields.foerderprogramm} format="text" />
        <RecordField label="Förderkategorie" value={record.fields.foerderkategorie} format="pill" />
        <RecordField label="Gesamtkosten des Projekts (€)" value={record.fields.gesamtkosten} format="text" />
        <RecordField label="Beantragter Förderbetrag (€)" value={record.fields.beantragter_foerderbetrag} format="text" />
        <RecordField label="Eigenanteil (€)" value={record.fields.eigenanteil} format="text" />
        <RecordField label="Drittmittel (€)" value={record.fields.drittmittel} format="text" />
        <RecordField label="Finanzierungsplan" value={record.fields.finanzierungsplan} format="longtext" className="md:col-span-2" />
        <RecordField label="Projektziele" value={record.fields.projektziele} format="longtext" className="md:col-span-2" />
        <RecordField label="Zielgruppe" value={record.fields.zielgruppe} format="longtext" className="md:col-span-2" />
        <RecordField label="Geplante Maßnahmen" value={record.fields.massnahmen} format="longtext" className="md:col-span-2" />
        <RecordField label="Erwartete Ergebnisse" value={record.fields.erwartete_ergebnisse} format="longtext" className="md:col-span-2" />
        <RecordField label="Nachhaltigkeit des Projekts" value={record.fields.nachhaltigkeit} format="longtext" className="md:col-span-2" />
        <RecordField label="Eingangsdatum des Antrags" value={record.fields.eingangsdatum} format="date" />
        <RecordField label="Antragsstatus" value={record.fields.antragsstatus} format="pill" />
        <RecordField label="Zuständiger Sachbearbeiter" value={getSachbearbeiterDisplayName(record.fields.bearbeiter)} format="text" />
        <RecordField label="Bearbeitungsnotizen" value={record.fields.bearbeitungsnotizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAEGE} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          Löschen
        </Button>
      </div>

      <FoerderantraegeDialog
        open={editing}
        onClose={() => setEditing(false)}
        onSubmit={handleUpdate}
        defaultValues={record.fields}
        recordId={record.record_id}
        sachbearbeiterList={sachbearbeiterList}
        enablePhotoScan={AI_PHOTO_SCAN['Foerderantraege']}
        enablePhotoLocation={AI_PHOTO_LOCATION['Foerderantraege']}
      />

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Förderanträge löschen"
        description="Soll dieser Eintrag wirklich gelöscht werden? Diese Aktion kann nicht rückgängig gemacht werden."
      />
    </RecordView>
  );
}
