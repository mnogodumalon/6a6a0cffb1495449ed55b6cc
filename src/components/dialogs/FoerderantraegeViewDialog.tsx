import type { Foerderantraege, Sachbearbeiter } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { APP_IDS } from '@/types/app';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { MediaThumbnail } from '@/components/widgets/MediaViewer';
import { Badge } from '@/components/ui/badge';
import { IconPencil, IconFileText } from '@tabler/icons-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), 'dd.MM.yyyy', { locale: de }); } catch { return d; }
}

interface FoerderantraegeViewDialogProps {
  open: boolean;
  onClose: () => void;
  record: Foerderantraege | null;
  onEdit: (record: Foerderantraege) => void;
  sachbearbeiterList: Sachbearbeiter[];
}

export function FoerderantraegeViewDialog({ open, onClose, record, onEdit, sachbearbeiterList }: FoerderantraegeViewDialogProps) {
  function getSachbearbeiterDisplayName(url?: unknown) {
    if (!url) return '—';
    const id = extractRecordId(url);
    return sachbearbeiterList.find(r => r.record_id === id)?.fields.vorname ?? '—';
  }

  if (!record) return null;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Förderanträge anzeigen</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            Bearbeiten
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Anrede</Label>
            <Badge variant="secondary">{record.fields.anrede?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Vorname</Label>
            <p className="text-sm">{record.fields.antragsteller_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachname</Label>
            <p className="text-sm">{record.fields.antragsteller_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Organisation / Institution</Label>
            <p className="text-sm">{record.fields.organisation ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Rechtsform</Label>
            <Badge variant="secondary">{record.fields.rechtsform?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Straße</Label>
            <p className="text-sm">{record.fields.strasse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Hausnummer</Label>
            <p className="text-sm">{record.fields.hausnummer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Postleitzahl</Label>
            <p className="text-sm">{record.fields.plz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Ort</Label>
            <p className="text-sm">{record.fields.ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Land</Label>
            <p className="text-sm">{record.fields.land ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">E-Mail-Adresse des Antragstellers</Label>
            <p className="text-sm">{record.fields.antragsteller_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Telefonnummer des Antragstellers</Label>
            <p className="text-sm">{record.fields.antragsteller_telefon ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Website des Antragstellers</Label>
            <p className="text-sm">{record.fields.antragsteller_website ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Projekttitel</Label>
            <p className="text-sm">{record.fields.projekttitel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kurzbeschreibung des Projekts</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.projektkurzbeschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Projektbeginn</Label>
            <p className="text-sm">{formatDate(record.fields.projektbeginn)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Projektende</Label>
            <p className="text-sm">{formatDate(record.fields.projektende)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Projektort</Label>
            <p className="text-sm">{record.fields.projektort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Förderprogramm</Label>
            <p className="text-sm">{record.fields.foerderprogramm ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Förderkategorie</Label>
            <Badge variant="secondary">{record.fields.foerderkategorie?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Gesamtkosten des Projekts (€)</Label>
            <p className="text-sm">{record.fields.gesamtkosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Beantragter Förderbetrag (€)</Label>
            <p className="text-sm">{record.fields.beantragter_foerderbetrag ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eigenanteil (€)</Label>
            <p className="text-sm">{record.fields.eigenanteil ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Drittmittel (€)</Label>
            <p className="text-sm">{record.fields.drittmittel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Finanzierungsplan</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.finanzierungsplan ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Projektziele</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.projektziele ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zielgruppe</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.zielgruppe ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Geplante Maßnahmen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.massnahmen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Erwartete Ergebnisse</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.erwartete_ergebnisse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Nachhaltigkeit des Projekts</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.nachhaltigkeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Projektbeschreibung (Datei)</Label>
            {record.fields.datei_projektbeschreibung ? (
              <MediaThumbnail src={record.fields.datei_projektbeschreibung} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Kostenplan (Datei)</Label>
            {record.fields.datei_kostenplan ? (
              <MediaThumbnail src={record.fields.datei_kostenplan} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Weitere Anlagen</Label>
            {record.fields.datei_weitere_anlagen ? (
              <MediaThumbnail src={record.fields.datei_weitere_anlagen} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Eingangsdatum des Antrags</Label>
            <p className="text-sm">{formatDate(record.fields.eingangsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Antragsstatus</Label>
            <Badge variant="secondary">{record.fields.antragsstatus?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Zuständiger Sachbearbeiter</Label>
            <p className="text-sm">{getSachbearbeiterDisplayName(record.fields.bearbeiter)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Bearbeitungsnotizen</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.bearbeitungsnotizen ?? '—'}</p>
          </div>
          <div className="pt-2 border-t border-border">
            <AttachmentsSection appId={APP_IDS.FOERDERANTRAEGE} recordId={record.record_id} readOnly />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}