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
import { t, appLabel, fieldLabel, lookupLabel, dateFnsLocale, dateFormat } from '@/i18n';
import { format, parseISO } from 'date-fns';

function formatDate(d?: string) {
  if (!d) return '—';
  try { return format(parseISO(d), dateFormat(), { locale: dateFnsLocale() }); } catch { return d; }
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
          <DialogTitle>{t('view_entity', { entity: appLabel('foerderantraege') })}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { onClose(); onEdit(record); }}>
            <IconPencil className="h-3.5 w-3.5 mr-1.5" />
            {t('edit_button')}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'anrede')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantraege', 'anrede', record.fields.anrede?.key) ?? record.fields.anrede?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'antragsteller_vorname')}</Label>
            <p className="text-sm">{record.fields.antragsteller_vorname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'antragsteller_nachname')}</Label>
            <p className="text-sm">{record.fields.antragsteller_nachname ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'organisation')}</Label>
            <p className="text-sm">{record.fields.organisation ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'rechtsform')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantraege', 'rechtsform', record.fields.rechtsform?.key) ?? record.fields.rechtsform?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'strasse')}</Label>
            <p className="text-sm">{record.fields.strasse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'hausnummer')}</Label>
            <p className="text-sm">{record.fields.hausnummer ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'plz')}</Label>
            <p className="text-sm">{record.fields.plz ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'ort')}</Label>
            <p className="text-sm">{record.fields.ort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'land')}</Label>
            <p className="text-sm">{record.fields.land ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'antragsteller_email')}</Label>
            <p className="text-sm">{record.fields.antragsteller_email ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'antragsteller_telefon')}</Label>
            <p className="text-sm">{record.fields.antragsteller_telefon ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'antragsteller_website')}</Label>
            <p className="text-sm">{record.fields.antragsteller_website ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'projekttitel')}</Label>
            <p className="text-sm">{record.fields.projekttitel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'projektkurzbeschreibung')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.projektkurzbeschreibung ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'projektbeginn')}</Label>
            <p className="text-sm">{formatDate(record.fields.projektbeginn)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'projektende')}</Label>
            <p className="text-sm">{formatDate(record.fields.projektende)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'projektort')}</Label>
            <p className="text-sm">{record.fields.projektort ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'foerderprogramm')}</Label>
            <p className="text-sm">{record.fields.foerderprogramm ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'foerderkategorie')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantraege', 'foerderkategorie', record.fields.foerderkategorie?.key) ?? record.fields.foerderkategorie?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'gesamtkosten')}</Label>
            <p className="text-sm">{record.fields.gesamtkosten ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'beantragter_foerderbetrag')}</Label>
            <p className="text-sm">{record.fields.beantragter_foerderbetrag ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'eigenanteil')}</Label>
            <p className="text-sm">{record.fields.eigenanteil ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'drittmittel')}</Label>
            <p className="text-sm">{record.fields.drittmittel ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'finanzierungsplan')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.finanzierungsplan ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'projektziele')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.projektziele ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'zielgruppe')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.zielgruppe ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'massnahmen')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.massnahmen ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'erwartete_ergebnisse')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.erwartete_ergebnisse ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'nachhaltigkeit')}</Label>
            <p className="text-sm whitespace-pre-wrap">{record.fields.nachhaltigkeit ?? '—'}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'datei_projektbeschreibung')}</Label>
            {record.fields.datei_projektbeschreibung ? (
              <MediaThumbnail src={record.fields.datei_projektbeschreibung} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'datei_kostenplan')}</Label>
            {record.fields.datei_kostenplan ? (
              <MediaThumbnail src={record.fields.datei_kostenplan} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'datei_weitere_anlagen')}</Label>
            {record.fields.datei_weitere_anlagen ? (
              <MediaThumbnail src={record.fields.datei_weitere_anlagen} fit="contain" className="w-full rounded-lg border" />
            ) : <p className="text-sm text-muted-foreground">—</p>}
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'eingangsdatum')}</Label>
            <p className="text-sm">{formatDate(record.fields.eingangsdatum)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'antragsstatus')}</Label>
            <Badge variant="secondary">{lookupLabel('foerderantraege', 'antragsstatus', record.fields.antragsstatus?.key) ?? record.fields.antragsstatus?.label ?? '—'}</Badge>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'bearbeiter')}</Label>
            <p className="text-sm">{getSachbearbeiterDisplayName(record.fields.bearbeiter)}</p>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">{fieldLabel('foerderantraege', 'bearbeitungsnotizen')}</Label>
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