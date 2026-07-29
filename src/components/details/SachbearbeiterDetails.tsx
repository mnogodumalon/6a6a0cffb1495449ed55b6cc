import type { Sachbearbeiter, Foerderantraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { SatelliteSection } from '@/components/SatelliteSection';

export interface SachbearbeiterDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Sachbearbeiter;
  /** 1:N „Förderanträge": VOLLE Liste — der Block filtert auf diesen Record. */
  foerderantraegeList: Foerderantraege[];
  /** Zeilen-Klick → overlay.push auf das Foerderantraege-Detail (nie der Edit-Dialog). */
  onOpenFoerderantraege: (record: Foerderantraege) => void;
  /** Kontextuelles „+": öffnet den Foerderantraege-Dialog mit diesem Record vorgesetzt. */
  onAddFoerderantraege: () => void;
}

export function SachbearbeiterDetails({
  record,
  foerderantraegeList,
  onOpenFoerderantraege,
  onAddFoerderantraege,
}: SachbearbeiterDetailsProps) {
  return (
    <>
      <RecordSection title="Details" cols={2}>
        <RecordField label="Vorname" value={record.fields.vorname} format="text" />
        <RecordField label="Nachname" value={record.fields.nachname} format="text" />
        <RecordField label="E-Mail-Adresse" value={record.fields.email} format="email" />
        <RecordField label="Telefonnummer" value={record.fields.telefon} format="text" />
        <RecordField label="Abteilung" value={record.fields.abteilung} format="text" />
        <RecordField label="Funktion / Rolle" value={record.fields.funktion} format="text" />
      </RecordSection>

      <SatelliteSection
        title="Förderanträge"
        items={foerderantraegeList.filter(r => extractRecordId(r.fields.bearbeiter) === record.record_id)}
        map={r => ({ name: r.fields.antragsteller_vorname ?? 'Förderanträge', meta: r.fields.projektbeginn })}
        onOpen={onOpenFoerderantraege}
        onAdd={onAddFoerderantraege}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.SACHBEARBEITER} recordId={record.record_id} />
    </>
  );
}
