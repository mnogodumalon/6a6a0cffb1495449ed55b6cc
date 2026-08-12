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
import { t, appLabel, fieldLabel, localeTag, CURRENCY } from '@/i18n';

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
        title={t('not_found')}
        action={
          <Button variant="ghost" onClick={() => navigate('/foerderantraege')}>
            <IconArrowLeft className="h-4 w-4 mr-1.5" />
            {t('back')}
          </Button>
        }
      />
    );
  }

  return (
    <RecordView
      onBack={() => navigate('/foerderantraege')}
      onEdit={() => setEditing(true)}
      backLabel={t('back')}
      editLabel={t('edit_button')}
    >
      <RecordHeader title={record.fields.antragsteller_vorname ?? appLabel('foerderantraege')} />

      {(() => {
        const lookupLists: Record<string, unknown> = {
          bearbeiter: sachbearbeiterList,
        };
        const fmtComputed = (k: string, n: number) =>
          /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k)
            ? n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
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

      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('foerderantraege', 'anrede')} value={record.fields.anrede} format="pill" />
        <RecordField label={fieldLabel('foerderantraege', 'antragsteller_vorname')} value={record.fields.antragsteller_vorname} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'antragsteller_nachname')} value={record.fields.antragsteller_nachname} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'organisation')} value={record.fields.organisation} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'rechtsform')} value={record.fields.rechtsform} format="pill" />
        <RecordField label={fieldLabel('foerderantraege', 'strasse')} value={record.fields.strasse} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'hausnummer')} value={record.fields.hausnummer} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'plz')} value={record.fields.plz} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'land')} value={record.fields.land} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'antragsteller_email')} value={record.fields.antragsteller_email} format="email" />
        <RecordField label={fieldLabel('foerderantraege', 'antragsteller_telefon')} value={record.fields.antragsteller_telefon} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'antragsteller_website')} value={record.fields.antragsteller_website} format="url" />
        <RecordField label={fieldLabel('foerderantraege', 'projekttitel')} value={record.fields.projekttitel} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'projektkurzbeschreibung')} value={record.fields.projektkurzbeschreibung} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantraege', 'projektbeginn')} value={record.fields.projektbeginn} format="date" />
        <RecordField label={fieldLabel('foerderantraege', 'projektende')} value={record.fields.projektende} format="date" />
        <RecordField label={fieldLabel('foerderantraege', 'projektort')} value={record.fields.projektort} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'foerderprogramm')} value={record.fields.foerderprogramm} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'foerderkategorie')} value={record.fields.foerderkategorie} format="pill" />
        <RecordField label={fieldLabel('foerderantraege', 'gesamtkosten')} value={record.fields.gesamtkosten} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'beantragter_foerderbetrag')} value={record.fields.beantragter_foerderbetrag} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'eigenanteil')} value={record.fields.eigenanteil} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'drittmittel')} value={record.fields.drittmittel} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'finanzierungsplan')} value={record.fields.finanzierungsplan} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantraege', 'projektziele')} value={record.fields.projektziele} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantraege', 'zielgruppe')} value={record.fields.zielgruppe} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantraege', 'massnahmen')} value={record.fields.massnahmen} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantraege', 'erwartete_ergebnisse')} value={record.fields.erwartete_ergebnisse} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantraege', 'nachhaltigkeit')} value={record.fields.nachhaltigkeit} format="longtext" className="md:col-span-2" />
        <RecordField label={fieldLabel('foerderantraege', 'eingangsdatum')} value={record.fields.eingangsdatum} format="date" />
        <RecordField label={fieldLabel('foerderantraege', 'antragsstatus')} value={record.fields.antragsstatus} format="pill" />
        <RecordField label={fieldLabel('foerderantraege', 'bearbeiter')} value={getSachbearbeiterDisplayName(record.fields.bearbeiter)} format="text" />
        <RecordField label={fieldLabel('foerderantraege', 'bearbeitungsnotizen')} value={record.fields.bearbeitungsnotizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAEGE} recordId={record.record_id} />

      <div className="flex justify-end pt-2">
        <Button variant="ghost" onClick={() => setDeleteOpen(true)} className="text-destructive hover:text-destructive">
          <IconTrash className="h-4 w-4 mr-1.5" />
          {t('delete')}
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
        title={t('delete_entity', { entity: appLabel('foerderantraege') })}
        description={t('confirm_delete_desc')}
      />
    </RecordView>
  );
}
