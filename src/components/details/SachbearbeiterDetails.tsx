import type { Sachbearbeiter, Foerderantraege } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
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
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('sachbearbeiter', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('sachbearbeiter', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('sachbearbeiter', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('sachbearbeiter', 'telefon')} value={record.fields.telefon} format="text" />
        <RecordField label={fieldLabel('sachbearbeiter', 'abteilung')} value={record.fields.abteilung} format="text" />
        <RecordField label={fieldLabel('sachbearbeiter', 'funktion')} value={record.fields.funktion} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('foerderantraege')}
        items={foerderantraegeList.filter(r => extractRecordId(r.fields.bearbeiter) === record.record_id)}
        map={r => ({ name: r.fields.antragsteller_vorname ?? appLabel('foerderantraege'), meta: r.fields.projektbeginn })}
        onOpen={onOpenFoerderantraege}
        onAdd={onAddFoerderantraege}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.SACHBEARBEITER} recordId={record.record_id} />
    </>
  );
}
