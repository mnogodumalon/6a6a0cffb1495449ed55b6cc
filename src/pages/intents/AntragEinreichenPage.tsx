/**
 * Antrag Einreichen — 4-Schritt-Wizard zum Erstellen eines Förderantrags.
 * Steps: 1) Antragsteller → 2) Projektdetails → 3) Finanzierung → 4) Einreichen & Bestätigen.
 * Reads: (keine Vorauswahl nötig). Writes: foerderantraege (createFoerderantraegeEntry).
 * Composes: IntentWizardShell, BudgetTracker.
 */

import { useState, type ReactNode } from 'react';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { BudgetTracker } from '@/components/blocks/BudgetTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LivingAppsService } from '@/services/livingAppsService';
import { LOOKUP_OPTIONS } from '@/types/app';
import { formatDate, formatCurrency } from '@/lib/formatters';
import {
  IconArrowRight,
  IconArrowLeft,
  IconSend,
  IconCheck,
  IconUser,
  IconBuildingCommunity,
  IconCalendar,
  IconCoin,
  IconAlertTriangle,
} from '@tabler/icons-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  // Step 1
  anrede: string;
  antragsteller_vorname: string;
  antragsteller_nachname: string;
  organisation: string;
  rechtsform: string;
  antragsteller_email: string;
  antragsteller_telefon: string;
  antragsteller_website: string;
  strasse: string;
  hausnummer: string;
  plz: string;
  ort: string;
  land: string;
  // Step 2
  projekttitel: string;
  projektkurzbeschreibung: string;
  projektbeginn: string;
  projektende: string;
  projektort: string;
  foerderprogramm: string;
  foerderkategorie: string;
  projektziele: string;
  zielgruppe: string;
  massnahmen: string;
  erwartete_ergebnisse: string;
  nachhaltigkeit: string;
  // Step 3
  gesamtkosten: string;
  beantragter_foerderbetrag: string;
  eigenanteil: string;
  drittmittel: string;
  finanzierungsplan: string;
  // Step 4
  eingangsdatum: string;
  bearbeitungsnotizen: string;
}

const TODAY = new Date().toISOString().split('T')[0];

const INITIAL_FORM: FormData = {
  anrede: '',
  antragsteller_vorname: '',
  antragsteller_nachname: '',
  organisation: '',
  rechtsform: '',
  antragsteller_email: '',
  antragsteller_telefon: '',
  antragsteller_website: '',
  strasse: '',
  hausnummer: '',
  plz: '',
  ort: '',
  land: 'Deutschland',
  projekttitel: '',
  projektkurzbeschreibung: '',
  projektbeginn: '',
  projektende: '',
  projektort: '',
  foerderprogramm: '',
  foerderkategorie: '',
  projektziele: '',
  zielgruppe: '',
  massnahmen: '',
  erwartete_ergebnisse: '',
  nachhaltigkeit: '',
  gesamtkosten: '',
  beantragter_foerderbetrag: '',
  eigenanteil: '',
  drittmittel: '',
  finanzierungsplan: '',
  eingangsdatum: TODAY,
  bearbeitungsnotizen: '',
};

const WIZARD_STEPS = [
  { label: 'Antragsteller' },
  { label: 'Projektdetails' },
  { label: 'Finanzierung' },
  { label: 'Einreichen' },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function parseNum(v: string): number | undefined {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? undefined : n;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 min-w-0">
      <span className="text-muted-foreground text-sm shrink-0 w-44">{label}</span>
      <span className="text-sm font-medium text-foreground truncate">{value}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-base font-semibold text-foreground mt-6 mb-3 first:mt-0">{children}</h3>;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AntragEinreichenPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  // ─── Lookup options ─────────────────────────────────────────────────────────
  const anredeOptions = LOOKUP_OPTIONS['foerderantraege']?.['anrede'] ?? [];
  const rechtsformOptions = LOOKUP_OPTIONS['foerderantraege']?.['rechtsform'] ?? [];
  const foerderkategorieOptions = LOOKUP_OPTIONS['foerderantraege']?.['foerderkategorie'] ?? [];
  const antragstatusOptions = LOOKUP_OPTIONS['foerderantraege']?.['antragsstatus'] ?? [];
  const initialStatus = antragstatusOptions[0]?.key ?? '';

  // ─── Derived financials ──────────────────────────────────────────────────────
  const gesamtkosten = parseNum(form.gesamtkosten) ?? 0;
  const foerderbetrag = parseNum(form.beantragter_foerderbetrag) ?? 0;
  const eigenanteil = parseNum(form.eigenanteil) ?? 0;
  const drittmittel = parseNum(form.drittmittel) ?? 0;
  const gedeckt = foerderbetrag + eigenanteil + drittmittel;
  const luecke = gesamtkosten - gedeckt;

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const setVal = (key: keyof FormData) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  // ─── Validation ──────────────────────────────────────────────────────────────
  const step1Valid =
    form.antragsteller_vorname.trim() !== '' &&
    form.antragsteller_nachname.trim() !== '' &&
    form.antragsteller_email.trim() !== '';

  const step2Valid = form.projekttitel.trim() !== '';

  const step3Valid = form.gesamtkosten.trim() !== '' && form.beantragter_foerderbetrag.trim() !== '';

  // ─── Submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await LivingAppsService.createFoerderantraegeEntry({
        anrede: form.anrede || undefined,
        antragsteller_vorname: form.antragsteller_vorname || undefined,
        antragsteller_nachname: form.antragsteller_nachname || undefined,
        organisation: form.organisation || undefined,
        rechtsform: form.rechtsform || undefined,
        antragsteller_email: form.antragsteller_email || undefined,
        antragsteller_telefon: form.antragsteller_telefon || undefined,
        antragsteller_website: form.antragsteller_website || undefined,
        strasse: form.strasse || undefined,
        hausnummer: form.hausnummer || undefined,
        plz: form.plz || undefined,
        ort: form.ort || undefined,
        land: form.land || undefined,
        projekttitel: form.projekttitel || undefined,
        projektkurzbeschreibung: form.projektkurzbeschreibung || undefined,
        projektbeginn: form.projektbeginn || undefined,
        projektende: form.projektende || undefined,
        projektort: form.projektort || undefined,
        foerderprogramm: form.foerderprogramm || undefined,
        foerderkategorie: form.foerderkategorie || undefined,
        projektziele: form.projektziele || undefined,
        zielgruppe: form.zielgruppe || undefined,
        massnahmen: form.massnahmen || undefined,
        erwartete_ergebnisse: form.erwartete_ergebnisse || undefined,
        nachhaltigkeit: form.nachhaltigkeit || undefined,
        gesamtkosten: parseNum(form.gesamtkosten),
        beantragter_foerderbetrag: parseNum(form.beantragter_foerderbetrag),
        eigenanteil: parseNum(form.eigenanteil),
        drittmittel: parseNum(form.drittmittel),
        finanzierungsplan: form.finanzierungsplan || undefined,
        eingangsdatum: form.eingangsdatum || TODAY,
        antragsstatus: initialStatus || undefined,
        bearbeitungsnotizen: form.bearbeitungsnotizen || undefined,
      });
      setSuccessId(result.record_id);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Unbekannter Fehler beim Einreichen.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setSuccessId(null);
    setSubmitError(null);
    setStep(1);
  };

  // ─── Success State ────────────────────────────────────────────────────────────
  if (successId) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <a href="#/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <IconArrowLeft size={14} className="shrink-0" />
          Zurück zum Dashboard
        </a>
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <IconCheck size={32} className="text-primary" stroke={2.5} />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">Antrag erfolgreich eingereicht!</h2>
            <p className="text-muted-foreground max-w-sm">
              Dein Förderantrag wurde gespeichert. Die Vorgangsnummer lautet:
            </p>
            <p className="font-mono text-sm bg-muted rounded-lg px-3 py-2 inline-block">{successId}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
            <Button onClick={handleReset} variant="default">
              Weiteren Antrag einreichen
            </Button>
            <a href="#/">
              <Button variant="outline" className="w-full sm:w-auto">
                Zurück zum Dashboard
              </Button>
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── Wizard ───────────────────────────────────────────────────────────────────
  return (
    <IntentWizardShell
      title="Förderantrag einreichen"
      subtitle="Fülle alle Schritte aus, um einen neuen Antrag zu stellen."
      steps={WIZARD_STEPS}
      currentStep={step}
      onStepChange={setStep}
    >

      {/* ── STEP 1: Antragsteller ─────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-6">
          {/* Anrede Tile Buttons */}
          <div className="space-y-2">
            <Label>Anrede</Label>
            <div className="flex flex-wrap gap-2">
              {anredeOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, anrede: opt.key }))}
                  className={`px-4 py-2 rounded-xl border text-sm font-medium transition-colors ${
                    form.anrede === opt.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="vorname">Vorname <span className="text-destructive">*</span></Label>
              <Input id="vorname" value={form.antragsteller_vorname} onChange={set('antragsteller_vorname')} placeholder="Max" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nachname">Nachname <span className="text-destructive">*</span></Label>
              <Input id="nachname" value={form.antragsteller_nachname} onChange={set('antragsteller_nachname')} placeholder="Mustermann" />
            </div>
          </div>

          {/* Organisation & Rechtsform */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="organisation">Organisation</Label>
              <Input id="organisation" value={form.organisation} onChange={set('organisation')} placeholder="Muster e.V." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rechtsform">Rechtsform</Label>
              <Select value={form.rechtsform} onValueChange={setVal('rechtsform')}>
                <SelectTrigger id="rechtsform">
                  <SelectValue placeholder="Bitte wählen..." />
                </SelectTrigger>
                <SelectContent>
                  {rechtsformOptions.map(opt => (
                    <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Kontaktdaten */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">E-Mail <span className="text-destructive">*</span></Label>
              <Input id="email" type="email" value={form.antragsteller_email} onChange={set('antragsteller_email')} placeholder="max@example.de" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefon">Telefon</Label>
              <Input id="telefon" type="tel" value={form.antragsteller_telefon} onChange={set('antragsteller_telefon')} placeholder="+49 123 456789" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="website">Website (optional)</Label>
            <Input id="website" type="url" value={form.antragsteller_website} onChange={set('antragsteller_website')} placeholder="https://www.example.de" />
          </div>

          {/* Adresse */}
          <div>
            <p className="text-sm font-medium text-foreground mb-3">Anschrift</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1.5">
                <Label htmlFor="strasse">Straße</Label>
                <Input id="strasse" value={form.strasse} onChange={set('strasse')} placeholder="Musterstraße" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="hausnummer">Hausnummer</Label>
                <Input id="hausnummer" value={form.hausnummer} onChange={set('hausnummer')} placeholder="12a" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="plz">PLZ</Label>
                <Input id="plz" value={form.plz} onChange={set('plz')} placeholder="12345" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ort">Ort</Label>
                <Input id="ort" value={form.ort} onChange={set('ort')} placeholder="Berlin" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="land">Land</Label>
                <Input id="land" value={form.land} onChange={set('land')} placeholder="Deutschland" />
              </div>
            </div>
          </div>

          {/* Live Summary */}
          {(form.antragsteller_vorname || form.antragsteller_nachname || form.organisation) && (
            <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <IconUser size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Antragsteller</p>
                <p className="font-semibold text-sm truncate">
                  {[form.antragsteller_vorname, form.antragsteller_nachname].filter(Boolean).join(' ') || '—'}
                </p>
                {form.organisation && (
                  <p className="text-xs text-muted-foreground truncate">{form.organisation}</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-end pt-2">
            <Button
              onClick={() => setStep(2)}
              disabled={!step1Valid}
              className="gap-2"
            >
              Weiter zu Projektdetails
              <IconArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Projektdetails ────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="projekttitel">Projekttitel <span className="text-destructive">*</span></Label>
            <Input id="projekttitel" value={form.projekttitel} onChange={set('projekttitel')} placeholder="Name deines Projekts" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projektkurzbeschreibung">Kurzbeschreibung</Label>
            <Textarea
              id="projektkurzbeschreibung"
              value={form.projektkurzbeschreibung}
              onChange={set('projektkurzbeschreibung')}
              placeholder="Beschreibe dein Projekt in 2–3 Sätzen..."
              rows={3}
            />
          </div>

          {/* Laufzeit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="projektbeginn">Projektbeginn</Label>
              <Input id="projektbeginn" type="date" value={form.projektbeginn} onChange={set('projektbeginn')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="projektende">Projektende</Label>
              <Input id="projektende" type="date" value={form.projektende} onChange={set('projektende')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="projektort">Projektort</Label>
              <Input id="projektort" value={form.projektort} onChange={set('projektort')} placeholder="Berlin" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="foerderprogramm">Förderprogramm</Label>
              <Input id="foerderprogramm" value={form.foerderprogramm} onChange={set('foerderprogramm')} placeholder="z.B. Bundesförderung XY" />
            </div>
          </div>

          {/* Förderkategorie Tiles */}
          <div className="space-y-2">
            <Label>Förderkategorie</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {foerderkategorieOptions.map(opt => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setForm(prev => ({ ...prev, foerderkategorie: opt.key }))}
                  className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors ${
                    form.foerderkategorie === opt.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card text-foreground border-border hover:border-primary/50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="projektziele">Projektziele</Label>
            <Textarea id="projektziele" value={form.projektziele} onChange={set('projektziele')} placeholder="Was soll das Projekt erreichen?" rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="zielgruppe">Zielgruppe</Label>
            <Textarea id="zielgruppe" value={form.zielgruppe} onChange={set('zielgruppe')} placeholder="Wen soll das Projekt ansprechen?" rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="massnahmen">Maßnahmen</Label>
            <Textarea id="massnahmen" value={form.massnahmen} onChange={set('massnahmen')} placeholder="Welche konkreten Maßnahmen sind geplant?" rows={3} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="erwartete_ergebnisse">Erwartete Ergebnisse</Label>
            <Textarea id="erwartete_ergebnisse" value={form.erwartete_ergebnisse} onChange={set('erwartete_ergebnisse')} placeholder="Was wird am Ende des Projekts erreicht sein?" rows={2} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nachhaltigkeit">Nachhaltigkeit</Label>
            <Textarea id="nachhaltigkeit" value={form.nachhaltigkeit} onChange={set('nachhaltigkeit')} placeholder="Wie wird das Projekt nach der Förderung weitergeführt?" rows={2} />
          </div>

          {/* Live Summary */}
          {form.projekttitel && (
            <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <IconCalendar size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground mb-0.5">Projekt</p>
                <p className="font-semibold text-sm truncate">{form.projekttitel}</p>
                {(form.projektbeginn || form.projektende) && (
                  <p className="text-xs text-muted-foreground">
                    {form.projektbeginn ? formatDate(form.projektbeginn) : '?'} – {form.projektende ? formatDate(form.projektende) : '?'}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
              <IconArrowLeft size={16} />
              Zurück
            </Button>
            <Button onClick={() => setStep(3)} disabled={!step2Valid} className="gap-2">
              Weiter zur Finanzierung
              <IconArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Finanzierung ──────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="gesamtkosten">Gesamtkosten (€) <span className="text-destructive">*</span></Label>
              <Input
                id="gesamtkosten"
                type="number"
                min="0"
                step="0.01"
                value={form.gesamtkosten}
                onChange={set('gesamtkosten')}
                placeholder="50000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="foerderbetrag">Beantragter Förderbetrag (€) <span className="text-destructive">*</span></Label>
              <Input
                id="foerderbetrag"
                type="number"
                min="0"
                step="0.01"
                value={form.beantragter_foerderbetrag}
                onChange={set('beantragter_foerderbetrag')}
                placeholder="30000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eigenanteil">Eigenanteil (€)</Label>
              <Input
                id="eigenanteil"
                type="number"
                min="0"
                step="0.01"
                value={form.eigenanteil}
                onChange={set('eigenanteil')}
                placeholder="10000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="drittmittel">Drittmittel (€, optional)</Label>
              <Input
                id="drittmittel"
                type="number"
                min="0"
                step="0.01"
                value={form.drittmittel}
                onChange={set('drittmittel')}
                placeholder="0"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="finanzierungsplan">Finanzierungsplan</Label>
            <Textarea
              id="finanzierungsplan"
              value={form.finanzierungsplan}
              onChange={set('finanzierungsplan')}
              placeholder="Beschreibe, wie die Gesamtkosten aufgeteilt und gedeckt werden..."
              rows={4}
            />
          </div>

          {/* Budget Tracker */}
          {gesamtkosten > 0 && (
            <BudgetTracker
              budget={gesamtkosten}
              booked={gedeckt}
              label="Finanzierungsübersicht"
            />
          )}

          {/* Deckungslücke Card */}
          {gesamtkosten > 0 && (
            <div className={`rounded-2xl border p-4 flex items-start gap-3 ${luecke > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${luecke > 0 ? 'bg-destructive/10' : 'bg-green-100 dark:bg-green-900/30'}`}>
                {luecke > 0
                  ? <IconAlertTriangle size={16} className="text-destructive" />
                  : <IconCheck size={16} className="text-green-600 dark:text-green-400" />
                }
              </div>
              <div className="min-w-0">
                <p className={`text-sm font-semibold ${luecke > 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                  {luecke > 0 ? 'Deckungslücke' : 'Vollständig gedeckt'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {luecke > 0
                    ? `${formatCurrency(luecke)} fehlen noch zur vollständigen Finanzierung.`
                    : `Die Gesamtkosten von ${formatCurrency(gesamtkosten)} sind vollständig abgedeckt.`
                  }
                </p>
              </div>
              <div className="ml-auto shrink-0">
                <span className={`font-bold text-lg ${luecke > 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                  {luecke > 0 ? `−${formatCurrency(Math.abs(luecke))}` : formatCurrency(luecke)}
                </span>
              </div>
            </div>
          )}

          {/* Finanzierungs-Übersicht */}
          {gesamtkosten > 0 && (
            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Finanzierungsstruktur</p>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><IconCoin size={14} className="text-primary" /> Förderbetrag</span>
                <span className="font-semibold">{formatCurrency(foerderbetrag)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><IconCoin size={14} className="text-muted-foreground" /> Eigenanteil</span>
                <span className="font-semibold">{formatCurrency(eigenanteil)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><IconCoin size={14} className="text-muted-foreground" /> Drittmittel</span>
                <span className="font-semibold">{formatCurrency(drittmittel)}</span>
              </div>
              <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
                <span>Gesamtkosten</span>
                <span>{formatCurrency(gesamtkosten)}</span>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
              <IconArrowLeft size={16} />
              Zurück
            </Button>
            <Button onClick={() => setStep(4)} disabled={!step3Valid} className="gap-2">
              Weiter zur Einreichung
              <IconArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 4: Einreichen ────────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Read-only Summary */}
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <IconUser size={14} className="text-primary" />
              </div>
              <SectionTitle>Antragsteller</SectionTitle>
            </div>
            <div className="space-y-1.5">
              <SummaryRow
                label="Name"
                value={[
                  anredeOptions.find(o => o.key === form.anrede)?.label,
                  form.antragsteller_vorname,
                  form.antragsteller_nachname,
                ].filter(Boolean).join(' ')}
              />
              <SummaryRow label="Organisation" value={form.organisation} />
              <SummaryRow
                label="Rechtsform"
                value={rechtsformOptions.find(o => o.key === form.rechtsform)?.label ?? ''}
              />
              <SummaryRow label="E-Mail" value={form.antragsteller_email} />
              <SummaryRow label="Telefon" value={form.antragsteller_telefon} />
              <SummaryRow
                label="Adresse"
                value={[form.strasse, form.hausnummer, form.plz, form.ort].filter(Boolean).join(' ')}
              />
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <IconBuildingCommunity size={14} className="text-primary" />
              </div>
              <SectionTitle>Projektdetails</SectionTitle>
            </div>
            <div className="space-y-1.5">
              <SummaryRow label="Projekttitel" value={form.projekttitel} />
              <SummaryRow
                label="Förderkategorie"
                value={foerderkategorieOptions.find(o => o.key === form.foerderkategorie)?.label ?? ''}
              />
              <SummaryRow label="Förderprogramm" value={form.foerderprogramm} />
              <SummaryRow label="Projektort" value={form.projektort} />
              <SummaryRow
                label="Laufzeit"
                value={
                  form.projektbeginn && form.projektende
                    ? `${formatDate(form.projektbeginn)} – ${formatDate(form.projektende)}`
                    : form.projektbeginn
                    ? `Ab ${formatDate(form.projektbeginn)}`
                    : ''
                }
              />
              {form.projektkurzbeschreibung && (
                <div className="min-w-0">
                  <span className="text-muted-foreground text-sm block mb-1">Kurzbeschreibung</span>
                  <p className="text-sm text-foreground line-clamp-2">{form.projektkurzbeschreibung}</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                <IconCoin size={14} className="text-primary" />
              </div>
              <SectionTitle>Finanzierung</SectionTitle>
            </div>
            <div className="space-y-1.5">
              <SummaryRow label="Gesamtkosten" value={gesamtkosten > 0 ? formatCurrency(gesamtkosten) : ''} />
              <SummaryRow label="Förderbetrag" value={foerderbetrag > 0 ? formatCurrency(foerderbetrag) : ''} />
              <SummaryRow label="Eigenanteil" value={eigenanteil > 0 ? formatCurrency(eigenanteil) : ''} />
              <SummaryRow label="Drittmittel" value={drittmittel > 0 ? formatCurrency(drittmittel) : ''} />
              {luecke !== 0 && gesamtkosten > 0 && (
                <SummaryRow
                  label="Deckungslücke"
                  value={luecke > 0 ? `${formatCurrency(luecke)} fehlen` : 'Vollständig gedeckt'}
                />
              )}
            </div>
          </div>

          {/* Eingangsdatum + Notizen */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="eingangsdatum">Eingangsdatum <span className="text-destructive">*</span></Label>
              <Input id="eingangsdatum" type="date" value={form.eingangsdatum} onChange={set('eingangsdatum')} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="bearbeitungsnotizen">Bearbeitungsnotizen (optional)</Label>
              <Textarea
                id="bearbeitungsnotizen"
                value={form.bearbeitungsnotizen}
                onChange={set('bearbeitungsnotizen')}
                placeholder="Interne Hinweise oder Anmerkungen zum Antrag..."
                rows={3}
              />
            </div>
          </div>

          {/* Status info */}
          <div className="rounded-xl border bg-muted/40 p-3 flex items-center gap-2">
            <IconCheck size={15} className="text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              Der Antrag wird mit dem Status <span className="font-medium text-foreground">{antragstatusOptions[0]?.label ?? 'Eingegangen'}</span> angelegt.
            </p>
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2">
              <IconAlertTriangle size={15} className="text-destructive shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{submitError}</p>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={() => setStep(3)} className="gap-2" disabled={submitting}>
              <IconArrowLeft size={16} />
              Zurück
            </Button>
            <Button onClick={handleSubmit} disabled={submitting || !form.eingangsdatum} className="gap-2">
              {submitting ? (
                <>Wird eingereicht…</>
              ) : (
                <>
                  <IconSend size={16} />
                  Antrag einreichen
                </>
              )}
            </Button>
          </div>
        </div>
      )}

    </IntentWizardShell>
  );
}
