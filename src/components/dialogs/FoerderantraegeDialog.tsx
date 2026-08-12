/**
 * FoerderantraegeDialog — pre-generated create/edit dialog for Foerderantraege.
 *
 * Props: open, onClose, onSubmit(fields) => Promise<void>, defaultValues?,
 * recordId? (pass when EDITING — enables the attachments section),
 * sachbearbeiterList (full hook array — resolves the Sachbearbeiter applookup),
 * enablePhotoScan?, enablePhotoLocation?.
 *
 * defaultValues is SHAPE-TOLERANT and its prop type is the EXPORTED
 * FoerderantraegeDialogDefaults — NOT the entity field type: lookup fields accept
 * the bare KEY string (or LookupValue), applookup fields the bare record id
 * (or record URL); the dialog normalizes. Type prefill STATE with the export:
 *  ❌ useState<Partial<Foerderantraege['fields']>>({ … })   // LookupValue fields reject string prefills (TS2322)
 *  ✓ useState<FoerderantraegeDialogDefaults | undefined>(undefined)
 */
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import type { Foerderantraege, Sachbearbeiter, LookupValue } from '@/types/app';
import { APP_IDS, LOOKUP_OPTIONS } from '@/types/app';
import { extractRecordId, createRecordUrl, cleanFieldsForApi, uploadFile, getUserProfile, LivingAppsService } from '@/services/livingAppsService';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ComputedContext } from '@/config/form-enhancements/types';
import { applyFieldOrder, flattenFieldOrder, applyDefaults, evalComputed, numberInputProps, clampNumberValue, classifyComputed, extractApplookupRefs, mergeApplookupRefs, resolveApplookupRef } from '@/config/form-enhancements/types';
import { formEnhancements, computedDeps, computedApplookupRefs } from '@/config/form-enhancements/Foerderantraege';
import { AttachmentsSection } from '@/components/AttachmentsSection';
import { t, appLabel, fieldLabel, lookupLabel, localeTag, CURRENCY } from '@/i18n';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Combobox } from '@/components/Combobox';
import { SachbearbeiterDialog } from '@/components/dialogs/SachbearbeiterDialog';
import { DatePicker } from '@/components/DatePicker';
import { Checkbox } from '@/components/ui/checkbox';
import { IconAlertCircle, IconCamera, IconChevronDown, IconCircleCheck, IconClipboard, IconFileText, IconLoader2, IconPhotoPlus, IconSparkles, IconUpload, IconX } from '@tabler/icons-react';
import { fileToDataUri, extractFromInput, extractPhotoMeta, reverseGeocode, dataUriToBlob } from '@/lib/ai';
import { lookupKey } from '@/lib/formatters';

/** Widened prefill type for FoerderantraegeDialog.defaultValues — see file header. */
export type FoerderantraegeDialogDefaults = Omit<Foerderantraege['fields'], 'anrede' | 'rechtsform' | 'foerderkategorie' | 'antragsstatus'> & {
    anrede?: LookupValue | string;
    rechtsform?: LookupValue | string;
    foerderkategorie?: LookupValue | string;
    antragsstatus?: LookupValue | string;
  };

interface FoerderantraegeDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (fields: Foerderantraege['fields']) => Promise<void>;
  /** SHAPE-TOLERANT: lookup fields accept the bare key (string) or the
   *  LookupValue object; applookup fields the bare record id or the full
   *  record URL — the dialog normalizes both. */
  defaultValues?: FoerderantraegeDialogDefaults;
  /** Record id when editing — enables the attachments section. Omit on create. */
  recordId?: string;
  sachbearbeiterList: Sachbearbeiter[];
  enablePhotoScan?: boolean;
  enablePhotoLocation?: boolean;
}

// defaultValues are SHAPE-TOLERANT: the dialog resolves bare lookup keys via
// its own options and bare record ids via the field's target app — consumers
// never carry the LookupValue/record-URL shape in their head.
const NORMALIZE_LOOKUPS: Record<string, readonly { key: string; label: string }[]> = {
  anrede: LOOKUP_OPTIONS['foerderantraege']?.['anrede'] ?? [],
  rechtsform: LOOKUP_OPTIONS['foerderantraege']?.['rechtsform'] ?? [],
  foerderkategorie: LOOKUP_OPTIONS['foerderantraege']?.['foerderkategorie'] ?? [],
  antragsstatus: LOOKUP_OPTIONS['foerderantraege']?.['antragsstatus'] ?? [],
};
const NORMALIZE_APPLOOKUPS: Record<string, string> = {
  bearbeiter: APP_IDS.SACHBEARBEITER,
};
function normalizeDefaults(values: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...values };
  for (const [k, opts] of Object.entries(NORMALIZE_LOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string') out[k] = opts.find(o => o.key === v) ?? { key: v, label: v };
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' ? opts.find(o => o.key === x) ?? { key: x, label: x } : x));
  }
  for (const [k, appId] of Object.entries(NORMALIZE_APPLOOKUPS)) {
    const v = out[k];
    if (typeof v === 'string' && v !== '' && !v.startsWith('http')) out[k] = createRecordUrl(appId, v);
    else if (Array.isArray(v)) out[k] = v.map(x => (typeof x === 'string' && x !== '' && !x.startsWith('http') ? createRecordUrl(appId, x) : x));
  }
  return out;
}

export function FoerderantraegeDialog({ open, onClose, onSubmit, defaultValues, recordId, sachbearbeiterList, enablePhotoScan = true, enablePhotoLocation = true }: FoerderantraegeDialogProps) {
  const [fields, setFields] = useState<Partial<Foerderantraege['fields']>>({});
  const [saving, setSaving] = useState(false);
  const normalizedDefaults = useMemo<Record<string, unknown> | undefined>(
    () => (defaultValues ? normalizeDefaults(defaultValues as Record<string, unknown>) : undefined),
    [defaultValues],
  );
  // Dirty-tracking: in edit-mode the Speichern button is disabled until the
  // user actually changes something. JSON.stringify is good enough for our
  // fields (plain values + LookupValue objects + string arrays).
  const isDirty = useMemo(() => {
    if (!normalizedDefaults) return true;  // create-mode: always allow submit
    try {
      return JSON.stringify(fields) !== JSON.stringify(normalizedDefaults);
    } catch {
      return true;
    }
  }, [fields, normalizedDefaults]);
  // Inline-Create state for "Sachbearbeiter" target. The dropdown's
  // "+ Neuer …" option opens a sub-dialog; on submit we POST, add the new
  // record to the local `extraSachbearbeiter` list, and select it in
  // the originating Combobox via the captured `createSachbearbeiterField`.
  const [createSachbearbeiterOpen, setCreateSachbearbeiterOpen] = useState(false);
  const [createSachbearbeiterInitial, setCreateSachbearbeiterInitial] = useState('');
  const [createSachbearbeiterField, setCreateSachbearbeiterField] = useState<string>('');
  const [extraSachbearbeiter, setExtraSachbearbeiter] = useState< Sachbearbeiter[]>([]);
  const sachbearbeiterListAll = useMemo(
    () => [...sachbearbeiterList, ...extraSachbearbeiter],
    [sachbearbeiterList, extraSachbearbeiter],
  );
  function openCreateSachbearbeiter(fieldKey: string, q: string) {
    setCreateSachbearbeiterField(fieldKey);
    setCreateSachbearbeiterInitial(q);
    setCreateSachbearbeiterOpen(true);
  }
  const [showErrors, setShowErrors] = useState(false);
  const REQUIRED_FIELDS = ['antragsteller_vorname', 'antragsteller_nachname', 'strasse', 'hausnummer', 'plz', 'ort', 'antragsteller_email', 'projekttitel', 'projektkurzbeschreibung', 'projektbeginn', 'projektende', 'gesamtkosten', 'beantragter_foerderbetrag', 'projektziele'] as const;
  const missingRequired = REQUIRED_FIELDS.filter(k => {
    const v = (fields as Record<string, unknown>)[k];
    return v == null || v === '' || (Array.isArray(v) && v.length === 0);
  });
  const [aiOpen, setAiOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [usePersonalInfo, setUsePersonalInfo] = useState(() => {
    try { return localStorage.getItem('ai-use-personal-info') === 'true'; } catch { return false; }
  });
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [profileData, setProfileData] = useState<Record<string, unknown> | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [aiText, setAiText] = useState('');

  // Computed-field plumbing. Pure no-op when formEnhancements.computed is {}.
  // The number renderer uses computedValues only as a fallback when the user
  // hasn't typed anything — clearing the input always restores the computation.
  // computedContext exposes applookup list props so { kind: 'applookup', ... }
  // operands can resolve to numeric fields on the target record.
  const computedContext = useMemo<ComputedContext>(() => ({
    lookupLists: {
      'bearbeiter': sachbearbeiterList,
    },
  }), [sachbearbeiterList, ]);
  const computedValues = useMemo<Record<string, number | null>>(() => {
    let out: Record<string, number | null> = {};
    const entries = Object.entries(formEnhancements.computed);
    for (let i = 0; i < 5; i++) {
      const merged: Record<string, unknown> = { ...(fields as Record<string, unknown>) };
      for (const [k, v] of Object.entries(out)) {
        if (v === null) continue;
        const cur = merged[k];
        if (cur === undefined || cur === null || cur === '') merged[k] = v;
      }
      const next: Record<string, number | null> = {};
      let changed = false;
      for (const [key, spec] of entries) {
        const v = evalComputed(spec, merged, computedContext);
        next[key] = v;
        if (v !== out[key]) changed = true;
      }
      out = next;
      if (!changed) break;
    }
    return out;
  }, [fields, computedContext]);

  useEffect(() => {
    if (open) {
      setFields(applyDefaults(normalizedDefaults ?? {}, formEnhancements.defaults) as Partial<Foerderantraege['fields']>);
      setPreview(null);
      setScanSuccess(false);
      setAiText('');
      setSubmitError(null);
    }
  }, [open, normalizedDefaults]);
  useEffect(() => {
    try { localStorage.setItem('ai-use-personal-info', String(usePersonalInfo)); } catch {}
  }, [usePersonalInfo]);
  async function handleShowProfileInfo() {
    if (showProfileInfo) { setShowProfileInfo(false); return; }
    setProfileLoading(true);
    try {
      const p = await getUserProfile();
      setProfileData(p);
    } catch {
      setProfileData(null);
    } finally {
      setProfileLoading(false);
      setShowProfileInfo(true);
    }
  }

  // Submit errors surface IN the dialog (it is modal — a banner in the page
  // body would be hidden behind it). A consumer onSubmit that THROWS (the
  // documented "throw to prevent closing" validation pattern) lands here:
  // the dialog stays open, nothing is saved, the message is visible.
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (missingRequired.length > 0) {
      setShowErrors(true);
      return;
    }
    setSaving(true);
    setSubmitError(null);
    try {
      // Fill empty number slots from computed values; user-typed values always win.
      // CRITICAL: only backend-mapped keys may be backfilled. Virtual computeds
      // (sub-agent invents `_netto`, `_bestellung_gesamtbetrag` etc. for the
      // "Berechnungen" display) have no backend counterpart — writing them
      // triggers a 422 from the Living-Apps API ("field does not exist").
      const merged = { ...fields };
      for (const [key, val] of Object.entries(computedValues)) {
        if (val === null) continue;
        if (!backendFieldSet.has(key)) continue;
        const cur = (merged as Record<string, unknown>)[key];
        if (cur === undefined || cur === null || cur === '') {
          (merged as Record<string, unknown>)[key] = val;
        }
      }
      const clean = cleanFieldsForApi(merged, 'foerderantraege');
      await onSubmit(clean as Foerderantraege['fields']);
      onClose();
    } catch (err) {
      setSubmitError(err instanceof Error && err.message ? err.message : t('submit_error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAiExtract(file?: File) {
    if (!file && !aiText.trim()) return;
    setScanning(true);
    setScanSuccess(false);
    try {
      let uri: string | undefined;
      let gps: { latitude: number; longitude: number } | null = null;
      let geoAddr = '';
      const parts: string[] = [];
      if (file) {
        const [dataUri, meta] = await Promise.all([fileToDataUri(file), extractPhotoMeta(file)]);
        uri = dataUri;
        if (file.type.startsWith('image/')) setPreview(uri);
        gps = enablePhotoLocation ? meta?.gps ?? null : null;
        if (gps) {
          geoAddr = await reverseGeocode(gps.latitude, gps.longitude);
          parts.push(`Location coordinates: ${gps.latitude}, ${gps.longitude}`);
          if (geoAddr) parts.push(`Reverse-geocoded address: ${geoAddr}`);
        }
        if (meta?.dateTime) {
          parts.push(`Date taken: ${meta.dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')}`);
        }
      }
      const contextParts: string[] = [];
      if (parts.length) {
        contextParts.push(`<photo-metadata>\nThe following metadata was extracted from the photo\'s EXIF data:\n${parts.join('\n')}\n</photo-metadata>`);
      }
      contextParts.push(`<available-records field="bearbeiter" entity="Sachbearbeiter">\n${JSON.stringify(sachbearbeiterList.map(r => ({ record_id: r.record_id, ...r.fields })), null, 2)}\n</available-records>`);
      if (usePersonalInfo) {
        try {
          const profile = await getUserProfile();
          contextParts.push(`<user-profile>\nThe following is the logged-in user\'s personal information. Use this to pre-fill relevant fields like name, email, address, company etc. when appropriate:\n${JSON.stringify(profile, null, 2)}\n</user-profile>`);
        } catch (err) {
          console.warn('Failed to fetch user profile:', err);
        }
      }
      const photoContext = contextParts.length ? contextParts.join('\n') : undefined;
      const schema = `{\n  "anrede": LookupValue | null, // Anrede (select one key: "herr" | "frau" | "divers" | "keine_angabe") mapping: herr=Herr, frau=Frau, divers=Divers, keine_angabe=Keine Angabe\n  "antragsteller_vorname": string | null, // Vorname\n  "antragsteller_nachname": string | null, // Nachname\n  "organisation": string | null, // Organisation / Institution\n  "rechtsform": LookupValue | null, // Rechtsform (select one key: "ev" | "gmbh" | "gbr" | "einzelperson" | "stiftung" | "sonstige") mapping: ev=Eingetragener Verein (e.V.), gmbh=GmbH, gbr=GbR, einzelperson=Einzelperson, stiftung=Stiftung, sonstige=Sonstige\n  "strasse": string | null, // Straße\n  "hausnummer": string | null, // Hausnummer\n  "plz": string | null, // Postleitzahl\n  "ort": string | null, // Ort\n  "land": string | null, // Land\n  "antragsteller_email": string | null, // E-Mail-Adresse des Antragstellers\n  "antragsteller_telefon": string | null, // Telefonnummer des Antragstellers\n  "antragsteller_website": string | null, // Website des Antragstellers\n  "projekttitel": string | null, // Projekttitel\n  "projektkurzbeschreibung": string | null, // Kurzbeschreibung des Projekts\n  "projektbeginn": string | null, // YYYY-MM-DD\n  "projektende": string | null, // YYYY-MM-DD\n  "projektort": string | null, // Projektort\n  "foerderprogramm": string | null, // Förderprogramm\n  "foerderkategorie": LookupValue | null, // Förderkategorie (select one key: "kultur_bildung" | "soziales_integration" | "umwelt_nachhaltigkeit" | "wirtschaft_innovation" | "sport_gesundheit" | "sonstige_kategorie") mapping: kultur_bildung=Kultur & Bildung, soziales_integration=Soziales & Integration, umwelt_nachhaltigkeit=Umwelt & Nachhaltigkeit, wirtschaft_innovation=Wirtschaft & Innovation, sport_gesundheit=Sport & Gesundheit, sonstige_kategorie=Sonstige\n  "gesamtkosten": number | null, // Gesamtkosten des Projekts (€)\n  "beantragter_foerderbetrag": number | null, // Beantragter Förderbetrag (€)\n  "eigenanteil": number | null, // Eigenanteil (€)\n  "drittmittel": number | null, // Drittmittel (€)\n  "finanzierungsplan": string | null, // Finanzierungsplan\n  "projektziele": string | null, // Projektziele\n  "zielgruppe": string | null, // Zielgruppe\n  "massnahmen": string | null, // Geplante Maßnahmen\n  "erwartete_ergebnisse": string | null, // Erwartete Ergebnisse\n  "nachhaltigkeit": string | null, // Nachhaltigkeit des Projekts\n  "eingangsdatum": string | null, // YYYY-MM-DD\n  "antragsstatus": LookupValue | null, // Antragsstatus (select one key: "eingegangen" | "in_bearbeitung" | "nachforderung" | "bewilligt" | "abgelehnt" | "zurueckgezogen") mapping: eingegangen=Eingegangen, in_bearbeitung=In Bearbeitung, nachforderung=Nachforderung, bewilligt=Bewilligt, abgelehnt=Abgelehnt, zurueckgezogen=Zurückgezogen\n  "bearbeiter": string | null, // Display name from Sachbearbeiter (see <available-records>)\n  "bearbeitungsnotizen": string | null, // Bearbeitungsnotizen\n}`;
      const raw = await extractFromInput<Record<string, unknown>>(schema, {
        dataUri: uri,
        userText: aiText.trim() || undefined,
        photoContext,
        intent: DIALOG_INTENT,
      });
      setFields(prev => {
        const merged = { ...prev } as Record<string, unknown>;
        function matchName(name: string, candidates: string[]): boolean {
          const n = name.toLowerCase().trim();
          return candidates.some(c => c.toLowerCase().includes(n) || n.includes(c.toLowerCase()));
        }
        const applookupKeys = new Set<string>(["bearbeiter"]);
        for (const [k, v] of Object.entries(raw)) {
          if (applookupKeys.has(k)) continue;
          if (v != null) merged[k] = v;
        }
        const bearbeiterName = raw['bearbeiter'] as string | null;
        if (bearbeiterName) {
          const bearbeiterMatch = sachbearbeiterList.find(r => matchName(bearbeiterName!, [[r.fields.vorname ?? '', r.fields.nachname ?? ''].filter(Boolean).join(' ')]));
          if (bearbeiterMatch) merged['bearbeiter'] = createRecordUrl(APP_IDS.SACHBEARBEITER, bearbeiterMatch.record_id);
        }
        return merged as Partial<Foerderantraege['fields']>;
      });
      // Upload scanned file to file fields
      if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
        try {
          const blob = dataUriToBlob(uri!);
          const fileUrl = await uploadFile(blob, file.name);
          setFields(prev => ({ ...prev, datei_projektbeschreibung: fileUrl }));
          setFields(prev => ({ ...prev, datei_kostenplan: fileUrl }));
          setFields(prev => ({ ...prev, datei_weitere_anlagen: fileUrl }));
        } catch (uploadErr) {
          console.error('File upload failed:', uploadErr);
        }
      }
      setAiText('');
      setScanSuccess(true);
      setTimeout(() => setScanSuccess(false), 3000);
    } catch (err) {
      console.error(`${t('scan_error')}:`, err);
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setScanning(false);
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) handleAiExtract(f);
    e.target.value = '';
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      handleAiExtract(file);
    }
  }, []);

  const DIALOG_INTENT = defaultValues
    ? t('edit_entity', { entity: appLabel('foerderantraege') })
    : t('new_entity', { entity: appLabel('foerderantraege') });

  const fieldBlocks: Record<string, React.ReactNode> = {
    'anrede': (
      <div key="anrede" className="space-y-1.5">
        <Label htmlFor="anrede">{fieldLabel('foerderantraege', 'anrede')}</Label>
        <div role="radiogroup" className="flex flex-wrap gap-1.5">
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'herr'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'herr' ? undefined : 'herr') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'herr'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantraege', 'anrede', 'herr') ?? 'Herr'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'frau'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'frau' ? undefined : 'frau') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'frau'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantraege', 'anrede', 'frau') ?? 'Frau'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'divers'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'divers' ? undefined : 'divers') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'divers'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantraege', 'anrede', 'divers') ?? 'Divers'}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={lookupKey(fields.anrede) === 'keine_angabe'}
            onClick={() => setFields(f => ({ ...f, anrede: (lookupKey(f.anrede) === 'keine_angabe' ? undefined : 'keine_angabe') as any }))}
            className={`inline-flex items-center justify-center min-h-9 max-sm:min-h-11 max-sm:px-4 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
              lookupKey(fields.anrede) === 'keine_angabe'
                ? 'bg-foreground text-background border-foreground'
                : 'bg-background text-foreground border-input hover:bg-accent'
            }`}
          >
            {lookupLabel('foerderantraege', 'anrede', 'keine_angabe') ?? 'Keine Angabe'}
          </button>
        </div>
      </div>
    ),
    'antragsteller_vorname': (
      <div key="antragsteller_vorname" className="space-y-1.5">
        <Label htmlFor="antragsteller_vorname">{fieldLabel('foerderantraege', 'antragsteller_vorname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="antragsteller_vorname"
          placeholder=""
          value={fields.antragsteller_vorname ?? ''}
          onChange={e => setFields(f => ({ ...f, antragsteller_vorname: e.target.value }))}
          required
        />
        {showErrors && !fields.antragsteller_vorname && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'antragsteller_nachname': (
      <div key="antragsteller_nachname" className="space-y-1.5">
        <Label htmlFor="antragsteller_nachname">{fieldLabel('foerderantraege', 'antragsteller_nachname')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="antragsteller_nachname"
          placeholder=""
          value={fields.antragsteller_nachname ?? ''}
          onChange={e => setFields(f => ({ ...f, antragsteller_nachname: e.target.value }))}
          required
        />
        {showErrors && !fields.antragsteller_nachname && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'organisation': (
      <div key="organisation" className="space-y-1.5">
        <Label htmlFor="organisation">{fieldLabel('foerderantraege', 'organisation')}</Label>
        <Input
          id="organisation"
          placeholder=""
          value={fields.organisation ?? ''}
          onChange={e => setFields(f => ({ ...f, organisation: e.target.value }))}
        />
      </div>
    ),
    'rechtsform': (
      <div key="rechtsform" className="space-y-1.5">
        <Label htmlFor="rechtsform">{fieldLabel('foerderantraege', 'rechtsform')}</Label>
        <Select
          value={lookupKey(fields.rechtsform) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, rechtsform: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="rechtsform" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="ev">{lookupLabel('foerderantraege', 'rechtsform', 'ev') ?? 'Eingetragener Verein (e.V.)'}</SelectItem>
            <SelectItem value="gmbh">{lookupLabel('foerderantraege', 'rechtsform', 'gmbh') ?? 'GmbH'}</SelectItem>
            <SelectItem value="gbr">{lookupLabel('foerderantraege', 'rechtsform', 'gbr') ?? 'GbR'}</SelectItem>
            <SelectItem value="einzelperson">{lookupLabel('foerderantraege', 'rechtsform', 'einzelperson') ?? 'Einzelperson'}</SelectItem>
            <SelectItem value="stiftung">{lookupLabel('foerderantraege', 'rechtsform', 'stiftung') ?? 'Stiftung'}</SelectItem>
            <SelectItem value="sonstige">{lookupLabel('foerderantraege', 'rechtsform', 'sonstige') ?? 'Sonstige'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'strasse': (
      <div key="strasse" className="space-y-1.5">
        <Label htmlFor="strasse">{fieldLabel('foerderantraege', 'strasse')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="strasse"
          placeholder=""
          value={fields.strasse ?? ''}
          onChange={e => setFields(f => ({ ...f, strasse: e.target.value }))}
          required
        />
        {showErrors && !fields.strasse && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'hausnummer': (
      <div key="hausnummer" className="space-y-1.5">
        <Label htmlFor="hausnummer">{fieldLabel('foerderantraege', 'hausnummer')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="hausnummer"
          placeholder=""
          value={fields.hausnummer ?? ''}
          onChange={e => setFields(f => ({ ...f, hausnummer: e.target.value }))}
          required
        />
        {showErrors && !fields.hausnummer && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'plz': (
      <div key="plz" className="space-y-1.5">
        <Label htmlFor="plz">{fieldLabel('foerderantraege', 'plz')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="plz"
          placeholder=""
          value={fields.plz ?? ''}
          onChange={e => setFields(f => ({ ...f, plz: e.target.value }))}
          required
        />
        {showErrors && !fields.plz && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'ort': (
      <div key="ort" className="space-y-1.5">
        <Label htmlFor="ort">{fieldLabel('foerderantraege', 'ort')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="ort"
          placeholder=""
          value={fields.ort ?? ''}
          onChange={e => setFields(f => ({ ...f, ort: e.target.value }))}
          required
        />
        {showErrors && !fields.ort && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'land': (
      <div key="land" className="space-y-1.5">
        <Label htmlFor="land">{fieldLabel('foerderantraege', 'land')}</Label>
        <Input
          id="land"
          placeholder=""
          value={fields.land ?? ''}
          onChange={e => setFields(f => ({ ...f, land: e.target.value }))}
        />
      </div>
    ),
    'antragsteller_email': (
      <div key="antragsteller_email" className="space-y-1.5">
        <Label htmlFor="antragsteller_email">{fieldLabel('foerderantraege', 'antragsteller_email')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="antragsteller_email"
          type="email"
          placeholder=""
          value={fields.antragsteller_email ?? ''}
          onChange={e => setFields(f => ({ ...f, antragsteller_email: e.target.value }))}
        />
        {showErrors && !fields.antragsteller_email && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'antragsteller_telefon': (
      <div key="antragsteller_telefon" className="space-y-1.5">
        <Label htmlFor="antragsteller_telefon">{fieldLabel('foerderantraege', 'antragsteller_telefon')}</Label>
        <Input
          id="antragsteller_telefon"
          value={fields.antragsteller_telefon ?? ''}
          onChange={e => setFields(f => ({ ...f, antragsteller_telefon: e.target.value }))}
        />
      </div>
    ),
    'antragsteller_website': (
      <div key="antragsteller_website" className="space-y-1.5">
        <Label htmlFor="antragsteller_website">{fieldLabel('foerderantraege', 'antragsteller_website')}</Label>
        <Input
          id="antragsteller_website"
          value={fields.antragsteller_website ?? ''}
          onChange={e => setFields(f => ({ ...f, antragsteller_website: e.target.value }))}
        />
      </div>
    ),
    'projekttitel': (
      <div key="projekttitel" className="space-y-1.5">
        <Label htmlFor="projekttitel">{fieldLabel('foerderantraege', 'projekttitel')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="projekttitel"
          placeholder=""
          value={fields.projekttitel ?? ''}
          onChange={e => setFields(f => ({ ...f, projekttitel: e.target.value }))}
          required
        />
        {showErrors && !fields.projekttitel && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektkurzbeschreibung': (
      <div key="projektkurzbeschreibung" className="space-y-1.5">
        <Label htmlFor="projektkurzbeschreibung">{fieldLabel('foerderantraege', 'projektkurzbeschreibung')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="projektkurzbeschreibung"
          placeholder=""
          value={fields.projektkurzbeschreibung ?? ''}
          onChange={e => setFields(f => ({ ...f, projektkurzbeschreibung: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.projektkurzbeschreibung && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektbeginn': (
      <div key="projektbeginn" className="space-y-1.5">
        <Label htmlFor="projektbeginn">{fieldLabel('foerderantraege', 'projektbeginn')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="projektbeginn"
          placeholder=""
          mode="date"
          value={fields.projektbeginn ?? null}
          onChange={v => setFields(f => ({ ...f, projektbeginn: v ?? undefined }))}
          required
        />
        {showErrors && !fields.projektbeginn && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektende': (
      <div key="projektende" className="space-y-1.5">
        <Label htmlFor="projektende">{fieldLabel('foerderantraege', 'projektende')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <DatePicker
          id="projektende"
          placeholder=""
          mode="date"
          value={fields.projektende ?? null}
          onChange={v => setFields(f => ({ ...f, projektende: v ?? undefined }))}
          required
        />
        {showErrors && !fields.projektende && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'projektort': (
      <div key="projektort" className="space-y-1.5">
        <Label htmlFor="projektort">{fieldLabel('foerderantraege', 'projektort')}</Label>
        <Input
          id="projektort"
          placeholder=""
          value={fields.projektort ?? ''}
          onChange={e => setFields(f => ({ ...f, projektort: e.target.value }))}
        />
      </div>
    ),
    'foerderprogramm': (
      <div key="foerderprogramm" className="space-y-1.5">
        <Label htmlFor="foerderprogramm">{fieldLabel('foerderantraege', 'foerderprogramm')}</Label>
        <Input
          id="foerderprogramm"
          placeholder=""
          value={fields.foerderprogramm ?? ''}
          onChange={e => setFields(f => ({ ...f, foerderprogramm: e.target.value }))}
        />
      </div>
    ),
    'foerderkategorie': (
      <div key="foerderkategorie" className="space-y-1.5">
        <Label htmlFor="foerderkategorie">{fieldLabel('foerderantraege', 'foerderkategorie')}</Label>
        <Select
          value={lookupKey(fields.foerderkategorie) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, foerderkategorie: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="foerderkategorie" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="kultur_bildung">{lookupLabel('foerderantraege', 'foerderkategorie', 'kultur_bildung') ?? 'Kultur & Bildung'}</SelectItem>
            <SelectItem value="soziales_integration">{lookupLabel('foerderantraege', 'foerderkategorie', 'soziales_integration') ?? 'Soziales & Integration'}</SelectItem>
            <SelectItem value="umwelt_nachhaltigkeit">{lookupLabel('foerderantraege', 'foerderkategorie', 'umwelt_nachhaltigkeit') ?? 'Umwelt & Nachhaltigkeit'}</SelectItem>
            <SelectItem value="wirtschaft_innovation">{lookupLabel('foerderantraege', 'foerderkategorie', 'wirtschaft_innovation') ?? 'Wirtschaft & Innovation'}</SelectItem>
            <SelectItem value="sport_gesundheit">{lookupLabel('foerderantraege', 'foerderkategorie', 'sport_gesundheit') ?? 'Sport & Gesundheit'}</SelectItem>
            <SelectItem value="sonstige_kategorie">{lookupLabel('foerderantraege', 'foerderkategorie', 'sonstige_kategorie') ?? 'Sonstige'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'gesamtkosten': (
      <div key="gesamtkosten" className="space-y-1.5">
        <Label htmlFor="gesamtkosten">{fieldLabel('foerderantraege', 'gesamtkosten')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="gesamtkosten"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'gesamtkosten')}
          placeholder=""
          value={fields.gesamtkosten !== undefined ? fields.gesamtkosten : (computedValues['gesamtkosten'] ?? '')}
          onChange={e => setFields(f => ({ ...f, gesamtkosten: clampNumberValue(formEnhancements, 'gesamtkosten', e.target.value) }))}
        />
        {showErrors && !fields.gesamtkosten && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'beantragter_foerderbetrag': (
      <div key="beantragter_foerderbetrag" className="space-y-1.5">
        <Label htmlFor="beantragter_foerderbetrag">{fieldLabel('foerderantraege', 'beantragter_foerderbetrag')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Input
          id="beantragter_foerderbetrag"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'beantragter_foerderbetrag')}
          placeholder=""
          value={fields.beantragter_foerderbetrag !== undefined ? fields.beantragter_foerderbetrag : (computedValues['beantragter_foerderbetrag'] ?? '')}
          onChange={e => setFields(f => ({ ...f, beantragter_foerderbetrag: clampNumberValue(formEnhancements, 'beantragter_foerderbetrag', e.target.value) }))}
        />
        {showErrors && !fields.beantragter_foerderbetrag && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'eigenanteil': (
      <div key="eigenanteil" className="space-y-1.5">
        <Label htmlFor="eigenanteil">{fieldLabel('foerderantraege', 'eigenanteil')}</Label>
        <Input
          id="eigenanteil"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'eigenanteil')}
          placeholder=""
          value={fields.eigenanteil !== undefined ? fields.eigenanteil : (computedValues['eigenanteil'] ?? '')}
          onChange={e => setFields(f => ({ ...f, eigenanteil: clampNumberValue(formEnhancements, 'eigenanteil', e.target.value) }))}
        />
      </div>
    ),
    'drittmittel': (
      <div key="drittmittel" className="space-y-1.5">
        <Label htmlFor="drittmittel">{fieldLabel('foerderantraege', 'drittmittel')}</Label>
        <Input
          id="drittmittel"
          type="number"
          step="any"
          {...numberInputProps(formEnhancements, 'drittmittel')}
          placeholder=""
          value={fields.drittmittel !== undefined ? fields.drittmittel : (computedValues['drittmittel'] ?? '')}
          onChange={e => setFields(f => ({ ...f, drittmittel: clampNumberValue(formEnhancements, 'drittmittel', e.target.value) }))}
        />
      </div>
    ),
    'finanzierungsplan': (
      <div key="finanzierungsplan" className="space-y-1.5">
        <Label htmlFor="finanzierungsplan">{fieldLabel('foerderantraege', 'finanzierungsplan')}</Label>
        <Textarea
          id="finanzierungsplan"
          placeholder=""
          value={fields.finanzierungsplan ?? ''}
          onChange={e => setFields(f => ({ ...f, finanzierungsplan: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'projektziele': (
      <div key="projektziele" className="space-y-1.5">
        <Label htmlFor="projektziele">{fieldLabel('foerderantraege', 'projektziele')} <span className="text-destructive" aria-hidden="true">*</span></Label>
        <Textarea
          id="projektziele"
          placeholder=""
          value={fields.projektziele ?? ''}
          onChange={e => setFields(f => ({ ...f, projektziele: e.target.value }))}
          rows={3}
        />
        {showErrors && !fields.projektziele && (
          <p className="text-xs text-destructive mt-1">{t('required_hint')}</p>
        )}
      </div>
    ),
    'zielgruppe': (
      <div key="zielgruppe" className="space-y-1.5">
        <Label htmlFor="zielgruppe">{fieldLabel('foerderantraege', 'zielgruppe')}</Label>
        <Textarea
          id="zielgruppe"
          placeholder=""
          value={fields.zielgruppe ?? ''}
          onChange={e => setFields(f => ({ ...f, zielgruppe: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'massnahmen': (
      <div key="massnahmen" className="space-y-1.5">
        <Label htmlFor="massnahmen">{fieldLabel('foerderantraege', 'massnahmen')}</Label>
        <Textarea
          id="massnahmen"
          placeholder=""
          value={fields.massnahmen ?? ''}
          onChange={e => setFields(f => ({ ...f, massnahmen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'erwartete_ergebnisse': (
      <div key="erwartete_ergebnisse" className="space-y-1.5">
        <Label htmlFor="erwartete_ergebnisse">{fieldLabel('foerderantraege', 'erwartete_ergebnisse')}</Label>
        <Textarea
          id="erwartete_ergebnisse"
          placeholder=""
          value={fields.erwartete_ergebnisse ?? ''}
          onChange={e => setFields(f => ({ ...f, erwartete_ergebnisse: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'nachhaltigkeit': (
      <div key="nachhaltigkeit" className="space-y-1.5">
        <Label htmlFor="nachhaltigkeit">{fieldLabel('foerderantraege', 'nachhaltigkeit')}</Label>
        <Textarea
          id="nachhaltigkeit"
          placeholder=""
          value={fields.nachhaltigkeit ?? ''}
          onChange={e => setFields(f => ({ ...f, nachhaltigkeit: e.target.value }))}
          rows={3}
        />
      </div>
    ),
    'datei_projektbeschreibung': (
      <div key="datei_projektbeschreibung" className="space-y-1.5">
        <Label htmlFor="datei_projektbeschreibung">{fieldLabel('foerderantraege', 'datei_projektbeschreibung')}</Label>
        {fields.datei_projektbeschreibung ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <IconFileText size={20} className="text-muted-foreground" />
              </div>
              <img
                src={fields.datei_projektbeschreibung}
                alt=""
                className="relative h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">{fields.datei_projektbeschreibung.split("/").pop()}</p>
              <div className="flex gap-2 mt-1">
                <label
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t('fr_change')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileUrl = await uploadFile(file, file.name);
                        setFields(f => ({ ...f, datei_projektbeschreibung: fileUrl }));
                      } catch (err) { console.error('Upload failed:', err); }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setFields(f => ({ ...f, datei_projektbeschreibung: undefined }))}
                >
                  {t('fr_remove')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <IconUpload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('fr_upload_file')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fileUrl = await uploadFile(file, file.name);
                  setFields(f => ({ ...f, datei_projektbeschreibung: fileUrl }));
                } catch (err) { console.error('Upload failed:', err); }
              }}
            />
          </label>
        )}
      </div>
    ),
    'datei_kostenplan': (
      <div key="datei_kostenplan" className="space-y-1.5">
        <Label htmlFor="datei_kostenplan">{fieldLabel('foerderantraege', 'datei_kostenplan')}</Label>
        {fields.datei_kostenplan ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <IconFileText size={20} className="text-muted-foreground" />
              </div>
              <img
                src={fields.datei_kostenplan}
                alt=""
                className="relative h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">{fields.datei_kostenplan.split("/").pop()}</p>
              <div className="flex gap-2 mt-1">
                <label
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t('fr_change')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileUrl = await uploadFile(file, file.name);
                        setFields(f => ({ ...f, datei_kostenplan: fileUrl }));
                      } catch (err) { console.error('Upload failed:', err); }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setFields(f => ({ ...f, datei_kostenplan: undefined }))}
                >
                  {t('fr_remove')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <IconUpload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('fr_upload_file')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fileUrl = await uploadFile(file, file.name);
                  setFields(f => ({ ...f, datei_kostenplan: fileUrl }));
                } catch (err) { console.error('Upload failed:', err); }
              }}
            />
          </label>
        )}
      </div>
    ),
    'datei_weitere_anlagen': (
      <div key="datei_weitere_anlagen" className="space-y-1.5">
        <Label htmlFor="datei_weitere_anlagen">{fieldLabel('foerderantraege', 'datei_weitere_anlagen')}</Label>
        {fields.datei_weitere_anlagen ? (
          <div className="flex items-center gap-3 rounded-lg border p-2">
            <div className="relative h-14 w-14 shrink-0 rounded-md bg-muted overflow-hidden">
              <div className="absolute inset-0 flex items-center justify-center">
                <IconFileText size={20} className="text-muted-foreground" />
              </div>
              <img
                src={fields.datei_weitere_anlagen}
                alt=""
                className="relative h-full w-full object-cover"
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate text-foreground">{fields.datei_weitere_anlagen.split("/").pop()}</p>
              <div className="flex gap-2 mt-1">
                <label
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  {t('fr_change')}
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const fileUrl = await uploadFile(file, file.name);
                        setFields(f => ({ ...f, datei_weitere_anlagen: fileUrl }));
                      } catch (err) { console.error('Upload failed:', err); }
                    }}
                  />
                </label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-destructive"
                  onClick={() => setFields(f => ({ ...f, datei_weitere_anlagen: undefined }))}
                >
                  {t('fr_remove')}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <label
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-muted-foreground/25 p-4 cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-colors"
          >
            <IconUpload size={20} className="text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{t('fr_upload_file')}</span>
            <input
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  const fileUrl = await uploadFile(file, file.name);
                  setFields(f => ({ ...f, datei_weitere_anlagen: fileUrl }));
                } catch (err) { console.error('Upload failed:', err); }
              }}
            />
          </label>
        )}
      </div>
    ),
    'eingangsdatum': (
      <div key="eingangsdatum" className="space-y-1.5">
        <Label htmlFor="eingangsdatum">{fieldLabel('foerderantraege', 'eingangsdatum')}</Label>
        <DatePicker
          id="eingangsdatum"
          placeholder=""
          mode="date"
          value={fields.eingangsdatum ?? null}
          onChange={v => setFields(f => ({ ...f, eingangsdatum: v ?? undefined }))}
        />
      </div>
    ),
    'antragsstatus': (
      <div key="antragsstatus" className="space-y-1.5">
        <Label htmlFor="antragsstatus">{fieldLabel('foerderantraege', 'antragsstatus')}</Label>
        <Select
          value={lookupKey(fields.antragsstatus) ?? ''}
          onValueChange={v => setFields(f => ({ ...f, antragsstatus: v === 'none' ? undefined : v as any }))}
        >
          <SelectTrigger id="antragsstatus" className="max-sm:h-11"><SelectValue placeholder="" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            <SelectItem value="eingegangen">{lookupLabel('foerderantraege', 'antragsstatus', 'eingegangen') ?? 'Eingegangen'}</SelectItem>
            <SelectItem value="in_bearbeitung">{lookupLabel('foerderantraege', 'antragsstatus', 'in_bearbeitung') ?? 'In Bearbeitung'}</SelectItem>
            <SelectItem value="nachforderung">{lookupLabel('foerderantraege', 'antragsstatus', 'nachforderung') ?? 'Nachforderung'}</SelectItem>
            <SelectItem value="bewilligt">{lookupLabel('foerderantraege', 'antragsstatus', 'bewilligt') ?? 'Bewilligt'}</SelectItem>
            <SelectItem value="abgelehnt">{lookupLabel('foerderantraege', 'antragsstatus', 'abgelehnt') ?? 'Abgelehnt'}</SelectItem>
            <SelectItem value="zurueckgezogen">{lookupLabel('foerderantraege', 'antragsstatus', 'zurueckgezogen') ?? 'Zurückgezogen'}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    ),
    'bearbeiter': (
      <div key="bearbeiter" className="space-y-1.5">
        <Label htmlFor="bearbeiter">{fieldLabel('foerderantraege', 'bearbeiter')}</Label>
        <Combobox
          id="bearbeiter"
          placeholder=""
          items={sachbearbeiterListAll.map(r => ({
            id: r.record_id,
            label: String(r.fields.vorname ?? r.record_id),
          }))}
          value={extractRecordId(fields.bearbeiter)}
          onChange={id => setFields(f => ({ ...f, bearbeiter: id ? createRecordUrl(APP_IDS.SACHBEARBEITER, id) : undefined }))}
          onCreateNew={(q) => openCreateSachbearbeiter("bearbeiter", q)}
          createLabel={t('create_in', { entity: appLabel('sachbearbeiter') })}
        />
      </div>
    ),
    'bearbeitungsnotizen': (
      <div key="bearbeitungsnotizen" className="space-y-1.5">
        <Label htmlFor="bearbeitungsnotizen">{fieldLabel('foerderantraege', 'bearbeitungsnotizen')}</Label>
        <Textarea
          id="bearbeitungsnotizen"
          placeholder=""
          value={fields.bearbeitungsnotizen ?? ''}
          onChange={e => setFields(f => ({ ...f, bearbeitungsnotizen: e.target.value }))}
          rows={3}
        />
      </div>
    ),
  };
  const orderedFields = applyFieldOrder(Object.keys(fieldBlocks), formEnhancements.fieldOrder);
  const orderedFieldsKey = orderedFields.map((it) => typeof it === 'string' ? it : it.row.join('+')).join(',');

  // Render-Modell für Computed-Felder:
  //
  //   • BACKEND-FELDER mit computed-Eintrag (z.B. gesamtpreis bei einer
  //     Katzenpension) bleiben als normales Eingabe-Feld stehen. Der Number-
  //     Input nutzt den computed-Wert als Vorschlag, der User kann jederzeit
  //     überschreiben (clearing → restore computed).
  //   • VIRTUELLE computed-Keys (Eintrag in formEnhancements.computed, ABER
  //     kein passendes Backend-Feld in orderedFields) erscheinen NICHT als
  //     Input, sondern unten als kompakte 'Berechnungen'-Übersicht oder als
  //     Inline-Hint unter dem letzten beitragenden Input.
  const FIELD_LABELS: Record<string, string> = {"anrede": "Anrede", "antragsteller_vorname": "Vorname", "antragsteller_nachname": "Nachname", "organisation": "Organisation / Institution", "rechtsform": "Rechtsform", "strasse": "Straße", "hausnummer": "Hausnummer", "plz": "Postleitzahl", "ort": "Ort", "land": "Land", "antragsteller_email": "E-Mail-Adresse des Antragstellers", "antragsteller_telefon": "Telefonnummer des Antragstellers", "antragsteller_website": "Website des Antragstellers", "projekttitel": "Projekttitel", "projektkurzbeschreibung": "Kurzbeschreibung des Projekts", "projektbeginn": "Projektbeginn", "projektende": "Projektende", "projektort": "Projektort", "foerderprogramm": "Förderprogramm", "foerderkategorie": "Förderkategorie", "gesamtkosten": "Gesamtkosten des Projekts (€)", "beantragter_foerderbetrag": "Beantragter Förderbetrag (€)", "eigenanteil": "Eigenanteil (€)", "drittmittel": "Drittmittel (€)", "finanzierungsplan": "Finanzierungsplan", "projektziele": "Projektziele", "zielgruppe": "Zielgruppe", "massnahmen": "Geplante Maßnahmen", "erwartete_ergebnisse": "Erwartete Ergebnisse", "nachhaltigkeit": "Nachhaltigkeit des Projekts", "datei_projektbeschreibung": "Projektbeschreibung (Datei)", "datei_kostenplan": "Kostenplan (Datei)", "datei_weitere_anlagen": "Weitere Anlagen", "eingangsdatum": "Eingangsdatum des Antrags", "antragsstatus": "Antragsstatus", "bearbeiter": "Zuständiger Sachbearbeiter", "bearbeitungsnotizen": "Bearbeitungsnotizen"};
  const CURRENCY_KEYS = new Set<string>(["gesamtkosten", "beantragter_foerderbetrag", "eigenanteil", "drittmittel"]);
  // Applookup-Referenz-Labels: pro applookup-Feld in dieser Form (ownKey)
  // eine Map { lookupKey: label } für ALLE Felder des Target-Schemas. Wird
  // beim Render-Walk gefiltert auf die in der computed-Formel tatsächlich
  // referenzierten lookupKeys (siehe applookupRefs unten).
  const APPLOOKUP_LABELS: Record<string, Record<string, string>> = {"bearbeiter": {"vorname": "Vorname", "nachname": "Nachname", "email": "E-Mail-Adresse", "telefon": "Telefonnummer", "abteilung": "Abteilung", "funktion": "Funktion / Rolle"}};
  const inputFields = useMemo(() => flattenFieldOrder(orderedFields), [orderedFieldsKey]);
  const backendFieldSet = useMemo(() => new Set(inputFields), [inputFields.join(',')]);
  const virtualComputed = useMemo(
    () => Object.fromEntries(
      Object.entries(formEnhancements.computed).filter(([k]) => !backendFieldSet.has(k)),
    ),
    [backendFieldSet],
  );
  const virtualFormEnhancements = useMemo(
    () => ({ ...formEnhancements, computed: virtualComputed }),
    [virtualComputed],
  );
  const computedLayout = useMemo(
    () => classifyComputed(virtualFormEnhancements, inputFields, computedDeps),
    [virtualFormEnhancements, inputFields.join(',')],
  );
  // Applookup-Referenzen: pro ownKey (Lookup-Feld im Form) die Liste der
  // lookupKeys, die in irgendeiner computed-Formel referenziert werden.
  // MODUS-1: aus dem Spec-Tree extrahiert. MODUS-2: aus dem Build-Time-
  // Export computedApplookupRefs (parse-formulas hat Regex-Pairs gesammelt).
  // Pro (ownKey, lookupKey)-Paar nur einmal; pro ownKey können aber mehrere
  // lookupKeys gleichzeitig auftauchen (z.B. einzelpreis UND karten10_preis
  // beim Yoga-Kurs), und alle werden separat als Inline-Hint gerendert.
  const applookupRefs = useMemo(
    () => mergeApplookupRefs(
      extractApplookupRefs(formEnhancements.computed),
      computedApplookupRefs,
    ),
    [],
  );
  function summaryLabel(k: string): string {
    if (FIELD_LABELS[k]) return FIELD_LABELS[k];
    // Leading underscore(s) als Virtual-Marker abstreifen; Unterstriche zu
    // Leerzeichen, jedes Wort kapitalisieren. Umlaute kommen vom Sub-Agent
    // direkt im Key (z. B. `_buchung_dauer_nächte`) — JS/TS/Vite unterstützen
    // Unicode-Identifier nativ, daher keine ASCII-Transliteration nötig.
    return k.replace(/^_+/, '')
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  function formatSummaryValue(k: string, v: unknown): string {
    if (v === undefined || v === null || v === '' || (typeof v === 'number' && !Number.isFinite(v))) return '—';
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return String(v);
    // Backend-Feld mit €-Label ODER virtueller Computed-Key, dessen Name nach Geld aussieht.
    const looksLikeCurrency = CURRENCY_KEYS.has(k) || /(?:kosten|preis|betrag|gesamt|netto|brutto|summe|mwst|rabatt|anzahlung|umsatz|saldo)/i.test(k);
    if (looksLikeCurrency) {
      return n.toLocaleString(localeTag(), { style: 'currency', currency: CURRENCY, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
    return n.toLocaleString(localeTag(), { maximumFractionDigits: 2 });
  }

  return (
    <>
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[92vh] flex flex-col overflow-hidden p-0 gap-0 max-sm:[&>button]:size-10 max-sm:[&>button]:grid max-sm:[&>button]:place-items-center max-sm:[&>button]:rounded-full max-sm:[&>button]:border max-sm:[&>button]:border-input max-sm:[&>button]:bg-background max-sm:[&>button]:opacity-100 max-sm:[&>button>svg]:size-5">
        <DialogHeader className="px-6 pt-5 pb-3 border-b flex flex-row items-center gap-3 space-y-0">
          <DialogTitle className="flex-1 truncate text-left">{DIALOG_INTENT}</DialogTitle>
          {enablePhotoScan && (
            <button
              type="button"
              onClick={() => setAiOpen(o => !o)}
              aria-expanded={aiOpen}
              aria-controls="ai-fill-panel"
              className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 max-sm:py-2.5 max-sm:px-4 text-xs font-semibold transition-all mr-7 max-sm:mr-12 shadow-sm ${
                aiOpen
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                  : 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15 hover:border-primary/50'
              }`}
            >
              <IconSparkles className={`h-3.5 w-3.5 ${aiOpen ? '' : 'text-primary'}`} />
              <span className="hidden sm:inline">{t('smart_fill')}</span>
              <IconChevronDown className={`h-3 w-3 transition-transform ${aiOpen ? 'rotate-180' : ''}`} />
            </button>
          )}
        </DialogHeader>
        {enablePhotoScan && aiOpen && (
          <div id="ai-fill-panel" className="border-b bg-muted/20 px-6 py-4 space-y-3">
            <p className="text-xs text-muted-foreground">{t('scan_header_sub')}</p>
            <div className="flex items-start gap-2 pl-0.5">
              <Checkbox
                id="ai-use-personal-info"
                checked={usePersonalInfo}
                onCheckedChange={(v) => setUsePersonalInfo(!!v)}
                className="mt-0.5"
              />
              <span className="text-xs text-muted-foreground leading-snug">
                <Label htmlFor="ai-use-personal-info" className="text-xs font-normal text-muted-foreground cursor-pointer inline">
                  {t('useinfo_label')}
                </Label>
                {' '}
                <button type="button" onClick={handleShowProfileInfo} className="text-xs text-primary hover:underline whitespace-nowrap">
                  {profileLoading ? t('useinfo_loading') : `(${t('useinfo_more')})`}
                </button>
              </span>
            </div>
            {showProfileInfo && (
              <div className="rounded-md border bg-muted/50 p-2 text-xs max-h-40 overflow-y-auto">
                <p className="font-medium mb-1">{t('profile_preamble')}</p>
                {profileData ? Object.values(profileData).map((v, i) => (
                  <span key={i}>{i > 0 && ", "}{typeof v === "object" ? JSON.stringify(v) : String(v)}</span>
                )) : (
                  <span className="text-muted-foreground">{t('useinfo_error')}</span>
                )}
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileSelect} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !scanning && fileInputRef.current?.click()}
              className={`
                relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
                ${scanning
                  ? 'border-primary/40 bg-primary/5'
                  : scanSuccess
                    ? 'border-green-500/40 bg-green-50/50 dark:bg-green-950/20'
                    : dragOver
                      ? 'border-primary bg-primary/10 scale-[1.01]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              {scanning ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconLoader2 className="h-7 w-7 text-primary animate-spin" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_analyzing')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_analyzing_sub')}</p>
                  </div>
                </div>
              ) : scanSuccess ? (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <IconCircleCheck className="h-7 w-7 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-green-700 dark:text-green-400">{t('scan_success')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('scan_success_sub')}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-3">
                  <div className="h-14 w-14 rounded-full bg-primary/8 flex items-center justify-center">
                    <IconPhotoPlus className="h-7 w-7 text-primary/70" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">{t('scan_upload')}</p>
                  </div>
                </div>
              )}

              {preview && !scanning && (
                <div className="absolute top-2 right-2">
                  <div className="relative group">
                    <img src={preview} alt="" className="h-10 w-10 rounded-md object-cover border shadow-sm" />
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); setPreview(null); }}
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-muted-foreground/80 text-white flex items-center justify-center"
                    >
                      <IconX className="h-2.5 w-2.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); cameraInputRef.current?.click(); }}>
                <IconCamera className="h-3.5 w-3.5 mr-1" />{t('scan_camera_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                <IconUpload className="h-3.5 w-3.5 mr-1" />{t('scan_file_btn')}
              </Button>
              <Button type="button" variant="outline" size="sm" className="h-10 text-xs" disabled={scanning}
                onClick={e => {
                  e.stopPropagation();
                  if (fileInputRef.current) {
                    fileInputRef.current.accept = 'application/pdf,.pdf';
                    fileInputRef.current.click();
                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = 'image/*,application/pdf'; }, 100);
                  }
                }}>
                <IconFileText className="h-3.5 w-3.5 mr-1" />{t('scan_doc_btn')}
              </Button>
            </div>

            <div className="relative">
              <Textarea
                placeholder={t('scan_text_placeholder')}
                value={aiText}
                onChange={e => {
                  setAiText(e.target.value);
                  const el = e.target;
                  el.style.height = 'auto';
                  el.style.height = Math.min(Math.max(el.scrollHeight, 56), 96) + 'px';
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && aiText.trim() && !scanning) {
                    e.preventDefault();
                    handleAiExtract();
                  }
                }}
                disabled={scanning}
                rows={2}
                className="pr-12 resize-none text-sm overflow-y-auto"
              />
              <button
                type="button"
                className="absolute right-2 top-2 h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                disabled={scanning}
                onClick={async () => {
                  try {
                    const text = await navigator.clipboard.readText();
                    if (text) setAiText(prev => prev ? prev + '\n' + text : text);
                  } catch {}
                }}
                title={t('paste')}
              >
                <IconClipboard className="h-4 w-4" />
              </button>
            </div>
            {aiText.trim() && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full h-9 text-xs"
                disabled={scanning}
                onClick={() => handleAiExtract()}
              >
                <IconSparkles className="h-3.5 w-3.5 mr-1.5" />{t('scan_text_analyze')}
              </Button>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col min-h-0 min-w-0 max-sm:[&_input]:h-11">
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 space-y-4 min-w-0">
            {(() => {
              const renderField = (k: string) => {
                const inlineHints = computedLayout.anchors[k] ?? [];
                const refs = applookupRefs[k] ?? [];
                return (
                  <div key={k} className="space-y-1.5 min-w-0">
                    {fieldBlocks[k]}
                    {refs.map(({ lookupKey }) => {
                      // Show the live numeric value the formula will pull from
                      // the selected lookup target (e.g. "Monatspreis: 34,90 €"
                      // under the Tarif combobox). Hidden while no lookup is
                      // selected or the target field is non-numeric.
                      const v = resolveApplookupRef(k, lookupKey, fields as Record<string, unknown>, computedContext);
                      if (v === null) return null;
                      const lbl = APPLOOKUP_LABELS[k]?.[lookupKey] ?? lookupKey;
                      const text = formatSummaryValue(lookupKey, v);
                      return (
                        <div key={`alh-${k}-${lookupKey}`} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{lbl}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                    {inlineHints.map((cKey) => {
                      const v = computedValues[cKey];
                      const text = formatSummaryValue(cKey, v);
                      if (text === '—') return null;
                      return (
                        <div key={cKey} className="flex items-center gap-1.5 pl-3 text-xs text-muted-foreground">
                          <span className="text-primary/70">→</span>
                          <span>{summaryLabel(cKey)}</span>
                          <span className="ml-auto font-medium tabular-nums text-foreground">{text}</span>
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return orderedFields.map((item, idx) => {
                if (typeof item === 'string') return renderField(item);
                const cols = item.cols ?? `repeat(${item.row.length}, minmax(0, 1fr))`;
                return (
                  <div key={`row-${idx}`} className="grid gap-3" style={{ gridTemplateColumns: cols }}>
                    {item.row.map(renderField)}
                  </div>
                );
              });
            })()}
            {(computedLayout.aggregates.length > 0 || computedLayout.finalTotal) && (
              <div className="mt-6 pt-4 border-t border-border space-y-1.5">
                {computedLayout.aggregates.length > 0 && (
                  <dl className="space-y-1.5 pb-2">
                    {computedLayout.aggregates.map((k) => {
                      const userVal = (fields as Record<string, unknown>)[k];
                      const computed = computedValues[k];
                      const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                      return (
                        <div key={k} className="flex justify-between items-baseline gap-3">
                          <dt className="text-sm text-muted-foreground truncate">{summaryLabel(k)}</dt>
                          <dd className="text-sm font-medium tabular-nums whitespace-nowrap">{formatSummaryValue(k, v)}</dd>
                        </div>
                      );
                    })}
                  </dl>
                )}
                {computedLayout.finalTotal && (() => {
                  const k = computedLayout.finalTotal;
                  const userVal = (fields as Record<string, unknown>)[k];
                  const computed = computedValues[k];
                  const v = userVal !== undefined && userVal !== null && userVal !== '' ? userVal : computed;
                  // Innere Border nur wenn aggregates existieren — sonst hätten wir
                  // zwei direkt aufeinanderfolgende Striche (Outer + Inner) mit nur
                  // einer Aggregat-Zeile dazwischen → zu viel visuelles Rauschen.
                  const sep = computedLayout.aggregates.length > 0 ? 'pt-3 border-t border-border' : 'pt-1';
                  return (
                    <div className={`flex justify-between items-baseline gap-3 ${sep}`}>
                      <span className="text-base font-semibold text-foreground">{summaryLabel(k)}</span>
                      <span className="text-lg font-bold tabular-nums whitespace-nowrap text-foreground">{formatSummaryValue(k, v)}</span>
                    </div>
                  );
                })()}
              </div>
            )}
            {showErrors && missingRequired.length > 0 && (
              <p className="text-xs text-destructive flex items-center gap-1.5" role="alert">
                <IconAlertCircle className="h-3.5 w-3.5 shrink-0" />
                {t('missing_required')}
              </p>
            )}
            {recordId && (
              <div className="pt-2 border-t border-border">
                <AttachmentsSection appId={APP_IDS.FOERDERANTRAEGE} recordId={recordId} />
              </div>
            )}
          </div>
          {submitError && (
            <div className="flex items-start gap-2 border-t border-destructive/20 bg-destructive/10 px-6 py-2.5 text-sm text-destructive" role="alert">
              <IconAlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span className="min-w-0 break-words">{submitError}</span>
            </div>
          )}
          <DialogFooter className="sticky bottom-0 border-t bg-background/95 backdrop-blur px-6 py-3 gap-2 max-sm:flex-row">
            <Button type="button" variant="outline" onClick={onClose} className="max-sm:h-12 max-sm:flex-1 max-sm:text-base">{t('cancel')}</Button>
            <Button
              type="submit"
              className="max-sm:h-12 max-sm:flex-1 max-sm:text-base"
              disabled={saving || !isDirty || (showErrors && missingRequired.length > 0)}
            >
              {saving ? t('saving') : defaultValues ? t('save') : t('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    {createSachbearbeiterOpen && (
      <SachbearbeiterDialog
        open={createSachbearbeiterOpen}
        onClose={() => setCreateSachbearbeiterOpen(false)}
        onSubmit={async (newFields) => {
          const result = await LivingAppsService.createSachbearbeiterEntry(newFields as any) as { id?: string };
          if (result?.id) {
            const newRec = { record_id: result.id, fields: newFields } as unknown as Sachbearbeiter;
            setExtraSachbearbeiter(prev => [...prev, newRec]);
            const url = createRecordUrl(APP_IDS.SACHBEARBEITER, result.id);
            setFields(prev => ({ ...prev, [createSachbearbeiterField]: url } as any));
          }
          setCreateSachbearbeiterOpen(false);
        }}
        defaultValues={createSachbearbeiterInitial
          ? ({ vorname: createSachbearbeiterInitial } as any)
          : undefined}
      />
    )}
    </>
  );
}