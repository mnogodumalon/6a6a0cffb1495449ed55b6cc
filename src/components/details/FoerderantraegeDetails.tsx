import type { Foerderantraege, Sachbearbeiter } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
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
        <RecordField label="Projektbeschreibung (Datei)" className="md:col-span-2">
          {record.fields.datei_projektbeschreibung ? (
            <MediaThumbnail src={record.fields.datei_projektbeschreibung as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label="Kostenplan (Datei)" className="md:col-span-2">
          {record.fields.datei_kostenplan ? (
            <MediaThumbnail src={record.fields.datei_kostenplan as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label="Weitere Anlagen" className="md:col-span-2">
          {record.fields.datei_weitere_anlagen ? (
            <MediaThumbnail src={record.fields.datei_weitere_anlagen as string} fit="contain" className="max-h-64 w-full rounded-lg" />
          ) : '—'}
        </RecordField>
        <RecordField label="Eingangsdatum des Antrags" value={record.fields.eingangsdatum} format="date" />
        <RecordField label="Antragsstatus" value={record.fields.antragsstatus} format="pill" />
        <RecordField label="Bearbeitungsnotizen" value={record.fields.bearbeitungsnotizen} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title="Verknüpft" cols={1}>
        <RecordRelation
          label="Zuständiger Sachbearbeiter"
          name={bearbeiterTarget?.fields.vorname ?? '—'}
          meta={[bearbeiterTarget?.fields.email, bearbeiterTarget?.fields.telefon].filter(Boolean).join(' · ') || undefined}
          onClick={bearbeiterTarget && onOpenSachbearbeiter ? () => onOpenSachbearbeiter!(bearbeiterTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.FOERDERANTRAEGE} recordId={record.record_id} />
    </>
  );
}
