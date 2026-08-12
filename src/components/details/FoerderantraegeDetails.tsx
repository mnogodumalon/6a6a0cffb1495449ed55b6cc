import type { Foerderantraege, Sachbearbeiter } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';

export interface FoerderantraegeDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Foerderantraege;
  /** N:1-Ziel „Sachbearbeiter": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  sachbearbeiterList: Sachbearbeiter[];
  /** Klick auf die Sachbearbeiter-Relation → overlay.push auf dessen Detail. */
  onOpenSachbearbeiter?: (record: Sachbearbeiter) => void;
}

export function FoerderantraegeDetails({
  record,
  sachbearbeiterList,
  onOpenSachbearbeiter,
}: FoerderantraegeDetailsProps) {
  const bearbeiterTarget = sachbearbeiterList.find(r => r.record_id === extractRecordId(record.fields.bearbeiter));
  return (
    <>
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
        <RecordField label={fieldLabel('foerderantraege', 'datei_projektbeschreibung')} className="md:col-span-2">
          {record.fields.datei_projektbeschreibung ? (
            <MediaThumbnail src={record.fields.datei_projektbeschreibung as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('foerderantraege', 'datei_kostenplan')} className="md:col-span-2">
          {record.fields.datei_kostenplan ? (
            <MediaThumbnail src={record.fields.datei_kostenplan as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('foerderantraege', 'datei_weitere_anlagen')} className="md:col-span-2">
          {record.fields.datei_weitere_anlagen ? (
            <MediaThumbnail src={record.fields.datei_weitere_anlagen as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label={fieldLabel('foerderantraege', 'eingangsdatum')} value={record.fields.eingangsdatum} format="date" />
        <RecordField label={fieldLabel('foerderantraege', 'antragsstatus')} value={record.fields.antragsstatus} format="pill" />
        <RecordField label={fieldLabel('foerderantraege', 'bearbeitungsnotizen')} value={record.fields.bearbeitungsnotizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('foerderantraege', 'bearbeiter')}
          name={bearbeiterTarget?.fields.vorname ?? '—'}
          meta={[bearbeiterTarget?.fields.email, bearbeiterTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={bearbeiterTarget && onOpenSachbearbeiter ? () => onOpenSachbearbeiter!(bearbeiterTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAEGE} recordId={record.record_id} />
    </>
  );
}
