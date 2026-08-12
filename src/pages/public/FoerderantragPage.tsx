import { useEffect, useState, type ReactNode } from 'react';
import { PublicShell } from '@/components/PublicShell';
import {
  loadPublicPagesConfig,
  createPublicRecord,
  prepareChallenge,
  PageUnavailableError,
  type PublicPagesConfig,
  type PublicPageConfig,
} from '@/lib/publicClient';
import { IntentWizardShell } from '@/components/blocks/IntentWizardShell';
import { BudgetTracker } from '@/components/blocks/BudgetTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate, formatCurrency } from '@/lib/formatters';
import {
  IconCheck,
  IconArrowRight,
  IconArrowLeft,
  IconSend,
  IconUser,
  IconBuildingCommunity,
  IconCalendar,
  IconCoin,
  IconAlertTriangle,
  IconFileText,
} from '@tabler/icons-react';
import { tx } from '@/i18n';

// ─── Lookup Options (aus Schema) ─────────────────────────────────────────────

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormData {
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
  gesamtkosten: string;
  beantragter_foerderbetrag: string;
  eigenanteil: string;
  drittmittel: string;
  finanzierungsplan: string;
}

// ─── Hilfskomponenten ─────────────────────────────────────────────────────────

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

function parseNum(v: string): number {
  const n = parseFloat(v.replace(',', '.'));
  return isNaN(n) ? 0 : n;
}

// ─── Hauptkomponente ──────────────────────────────────────────────────────────

export default function FoerderantragPage() {
  const WIZARD_STEPS = [
  { label: tx('Antragsteller') },
  { label: tx('Projektdetails') },
  { label: tx('Finanzierung') },
  { label: tx('Prüfen & Einreichen') },
];

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
};

  const FOERDERKATEGORIE_OPTIONS = [
  { key: 'kultur_bildung', label: tx('Kultur & Bildung') },
  { key: 'soziales_integration', label: tx('Soziales & Integration') },
  { key: 'umwelt_nachhaltigkeit', label: tx('Umwelt & Nachhaltigkeit') },
  { key: 'wirtschaft_innovation', label: tx('Wirtschaft & Innovation') },
  { key: 'sport_gesundheit', label: tx('Sport & Gesundheit') },
  { key: 'sonstige_kategorie', label: tx('Sonstige') },
];

  const RECHTSFORM_OPTIONS = [
  { key: 'ev', label: tx('Eingetragener Verein (e.V.)') },
  { key: 'gmbh', label: tx('GmbH') },
  { key: 'gbr', label: tx('GbR') },
  { key: 'einzelperson', label: tx('Einzelperson') },
  { key: 'stiftung', label: tx('Stiftung') },
  { key: 'sonstige', label: tx('Sonstige') },
];

  const ANREDE_OPTIONS = [
  { key: 'herr', label: tx('Herr') },
  { key: 'frau', label: tx('Frau') },
  { key: 'divers', label: tx('Divers') },
  { key: 'keine_angabe', label: tx('Keine Angabe') },
];

  // Alle Hooks vor den Early-Returns
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [challengePrepared, setChallengePrepared] = useState(false);

  useEffect(() => {
    loadPublicPagesConfig().then(c => {
      if (!c) { setLoading(false); setUnavailable(true); return; }
      const p = c.pages['foerderantrag'] ?? null;
      if (!p) { setLoading(false); setUnavailable(true); return; }
      setCfg(c);
      setPage(p);
      setLoading(false);
    });
  }, []);

  // ─── Early-Returns ────────────────────────────────────────────────────────
  if (loading || unavailable || !cfg || !page) {
    return <PublicShell loading={loading} unavailable={!loading && (unavailable || !cfg || !page)} />;
  }

  // ─── Finanzielle Werte ────────────────────────────────────────────────────
  const gesamtkosten = parseNum(form.gesamtkosten);
  const foerderbetrag = parseNum(form.beantragter_foerderbetrag);
  const eigenanteil = parseNum(form.eigenanteil);
  const drittmittel = parseNum(form.drittmittel);
  const gedeckt = foerderbetrag + eigenanteil + drittmittel;
  const luecke = gesamtkosten - gedeckt;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [key]: e.target.value }));

  const setVal = (key: keyof FormData) => (value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleFirstInteraction = () => {
    if (!challengePrepared) {
      prepareChallenge(cfg, page, 'POST', `/apps/${page.app_id}/records`);
      setChallengePrepared(true);
    }
  };

  // ─── Validierung ──────────────────────────────────────────────────────────
  const step1Valid =
    form.antragsteller_vorname.trim() !== '' &&
    form.antragsteller_nachname.trim() !== '' &&
    form.antragsteller_email.trim() !== '';

  const step2Valid = form.projekttitel.trim() !== '';

  const step3Valid =
    form.gesamtkosten.trim() !== '' &&
    form.beantragter_foerderbetrag.trim() !== '';

  // ─── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const fields: Record<string, unknown> = {
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
        gesamtkosten: parseNum(form.gesamtkosten) || undefined,
        beantragter_foerderbetrag: parseNum(form.beantragter_foerderbetrag) || undefined,
        eigenanteil: parseNum(form.eigenanteil) || undefined,
        drittmittel: parseNum(form.drittmittel) || undefined,
        finanzierungsplan: form.finanzierungsplan || undefined,
      };
      const result = await createPublicRecord(cfg, page, fields);
      setSuccessId(result.id);
    } catch (err) {
      if (err instanceof PageUnavailableError) {
        setSubmitError(tx('Diese Seite ist derzeit nicht verfügbar. Bitte versuche es später erneut.'));
      } else {
        setSubmitError(err instanceof Error ? err.message : tx('Unbekannter Fehler beim Einreichen.'));
      }
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

  // ─── Erfolgs-Zustand ──────────────────────────────────────────────────────
  if (successId) {
    return (
      <PublicShell title={tx('Antrag eingereicht')}>
        <div className="flex flex-col items-center justify-center py-16 gap-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <IconCheck size={32} className="text-primary" stroke={2.5} />
          </div>
          <div className="text-center space-y-2 max-w-sm">
            <h2 className="text-2xl font-bold tracking-tight">{tx('Antrag erfolgreich eingereicht!')}</h2>
            <p className="text-muted-foreground">
              {tx('Dein Förderantrag wurde übermittelt und wird nun geprüft. Bitte notiere deine Vorgangsnummer für Rückfragen:')}
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <IconFileText size={16} className="text-muted-foreground shrink-0" />
              <code className="font-mono text-sm bg-muted rounded-lg px-3 py-1.5 inline-block">{successId}</code>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4 text-sm text-muted-foreground text-center max-w-sm">
            {tx('Du erhältst eine Eingangsbestätigung, sobald dein Antrag bearbeitet wird. Bei Fragen wende dich direkt an uns.')}
          </div>
          <Button onClick={handleReset} variant="outline" className="mt-2">
            {tx('Weiteren Antrag einreichen')}
          </Button>
        </div>
      </PublicShell>
    );
  }

  // ─── Wizard ───────────────────────────────────────────────────────────────
  return (
    <PublicShell
      title={tx('Förderantrag einreichen')}
      description={tx('Reiche deinen Förderantrag in wenigen Schritten online ein.')}
    >
      {/* onFocus = Challenge pre-solve beim ersten Tippen */}
      <div onFocus={handleFirstInteraction}>
        <IntentWizardShell
          title={tx('Förderantrag einreichen')}
          subtitle={tx('Fülle alle Schritte aus. Pflichtfelder sind mit * markiert.')}
          steps={WIZARD_STEPS}
          currentStep={step}
          onStepChange={setStep}
          back={false}
        >

          {/* ── SCHRITT 1: Antragsteller ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Anrede */}
              <div className="space-y-2">
                <Label>{tx('Anrede')}</Label>
                <div className="flex flex-wrap gap-2">
                  {ANREDE_OPTIONS.map(opt => (
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
                  <Label htmlFor="vorname">{tx('Vorname')} <span className="text-destructive">*</span></Label>
                  <Input id="vorname" value={form.antragsteller_vorname} onChange={set('antragsteller_vorname')} placeholder={tx('Max')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="nachname">{tx('Nachname')} <span className="text-destructive">*</span></Label>
                  <Input id="nachname" value={form.antragsteller_nachname} onChange={set('antragsteller_nachname')} placeholder={tx('Mustermann')} />
                </div>
              </div>

              {/* Organisation & Rechtsform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="organisation">{tx('Organisation / Institution')}</Label>
                  <Input id="organisation" value={form.organisation} onChange={set('organisation')} placeholder={tx('Muster e.V.')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rechtsform">{tx('Rechtsform')}</Label>
                  <Select value={form.rechtsform} onValueChange={setVal('rechtsform')}>
                    <SelectTrigger id="rechtsform">
                      <SelectValue placeholder={tx('Bitte wählen...')} />
                    </SelectTrigger>
                    <SelectContent>
                      {RECHTSFORM_OPTIONS.map(opt => (
                        <SelectItem key={opt.key} value={opt.key}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Kontakt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">{tx('E-Mail')} <span className="text-destructive">*</span></Label>
                  <Input id="email" type="email" value={form.antragsteller_email} onChange={set('antragsteller_email')} placeholder={tx('max@example.de')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="telefon">{tx('Telefon')}</Label>
                  <Input id="telefon" type="tel" value={form.antragsteller_telefon} onChange={set('antragsteller_telefon')} placeholder="+49 123 456789" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="website">{tx('Website (optional)')}</Label>
                <Input id="website" type="url" value={form.antragsteller_website} onChange={set('antragsteller_website')} placeholder={tx('https://www.example.de')} />
              </div>

              {/* Anschrift */}
              <div>
                <p className="text-sm font-medium text-foreground mb-3">{tx('Anschrift')}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2 space-y-1.5">
                    <Label htmlFor="strasse">{tx('Straße')}</Label>
                    <Input id="strasse" value={form.strasse} onChange={set('strasse')} placeholder={tx('Musterstraße')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="hausnummer">{tx('Hausnummer')}</Label>
                    <Input id="hausnummer" value={form.hausnummer} onChange={set('hausnummer')} placeholder="12a" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="plz">{tx('PLZ')}</Label>
                    <Input id="plz" value={form.plz} onChange={set('plz')} placeholder="12345" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ort">{tx('Ort')}</Label>
                    <Input id="ort" value={form.ort} onChange={set('ort')} placeholder={tx('Berlin')} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="land">{tx('Land')}</Label>
                    <Input id="land" value={form.land} onChange={set('land')} placeholder={tx('Deutschland')} />
                  </div>
                </div>
              </div>

              {/* Live-Vorschau */}
              {(form.antragsteller_vorname || form.antragsteller_nachname || form.organisation) && (
                <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <IconUser size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{tx('Antragsteller')}</p>
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
                <Button onClick={() => setStep(2)} disabled={!step1Valid} className="gap-2">
                  {tx('Weiter zu Projektdetails')}
                  <IconArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ── SCHRITT 2: Projektdetails ────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="projekttitel">{tx('Projekttitel')} <span className="text-destructive">*</span></Label>
                <Input id="projekttitel" value={form.projekttitel} onChange={set('projekttitel')} placeholder={tx('Name deines Projekts')} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="projektkurzbeschreibung">{tx('Kurzbeschreibung')} <span className="text-destructive">*</span></Label>
                <Textarea
                  id="projektkurzbeschreibung"
                  value={form.projektkurzbeschreibung}
                  onChange={set('projektkurzbeschreibung')}
                  placeholder={tx('Beschreibe dein Projekt in 2–3 Sätzen...')}
                  rows={3}
                />
              </div>

              {/* Laufzeit */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="projektbeginn">{tx('Projektbeginn')}</Label>
                  <Input id="projektbeginn" type="date" value={form.projektbeginn} onChange={set('projektbeginn')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="projektende">{tx('Projektende')}</Label>
                  <Input id="projektende" type="date" value={form.projektende} onChange={set('projektende')} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="projektort">{tx('Projektort')}</Label>
                  <Input id="projektort" value={form.projektort} onChange={set('projektort')} placeholder={tx('Berlin')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="foerderprogramm">{tx('Förderprogramm')}</Label>
                  <Input id="foerderprogramm" value={form.foerderprogramm} onChange={set('foerderprogramm')} placeholder={tx('z.B. Bundesförderung XY')} />
                </div>
              </div>

              {/* Förderkategorie Kacheln */}
              <div className="space-y-2">
                <Label>{tx('Förderkategorie')}</Label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FOERDERKATEGORIE_OPTIONS.map(opt => (
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
                <Label htmlFor="projektziele">{tx('Projektziele')} <span className="text-destructive">*</span></Label>
                <Textarea id="projektziele" value={form.projektziele} onChange={set('projektziele')} placeholder={tx('Was soll das Projekt erreichen?')} rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="zielgruppe">{tx('Zielgruppe')}</Label>
                <Textarea id="zielgruppe" value={form.zielgruppe} onChange={set('zielgruppe')} placeholder={tx('Wen soll das Projekt ansprechen?')} rows={2} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="massnahmen">{tx('Geplante Maßnahmen')}</Label>
                <Textarea id="massnahmen" value={form.massnahmen} onChange={set('massnahmen')} placeholder={tx('Welche konkreten Maßnahmen sind geplant?')} rows={3} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="erwartete_ergebnisse">{tx('Erwartete Ergebnisse')}</Label>
                <Textarea id="erwartete_ergebnisse" value={form.erwartete_ergebnisse} onChange={set('erwartete_ergebnisse')} placeholder={tx('Was wird am Ende des Projekts erreicht sein?')} rows={2} />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nachhaltigkeit">{tx('Nachhaltigkeit')}</Label>
                <Textarea id="nachhaltigkeit" value={form.nachhaltigkeit} onChange={set('nachhaltigkeit')} placeholder={tx('Wie wird das Projekt nach der Förderung weitergeführt?')} rows={2} />
              </div>

              {/* Live-Vorschau */}
              {form.projekttitel && (
                <div className="rounded-2xl border bg-card p-4 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    <IconCalendar size={16} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground mb-0.5">{tx('Projekt')}</p>
                    <p className="font-semibold text-sm truncate">{form.projekttitel}</p>
                    {(form.projektbeginn || form.projektende) && (
                      <p className="text-xs text-muted-foreground">
                        {form.projektbeginn ? formatDate(form.projektbeginn) : '?'} –{' '}
                        {form.projektende ? formatDate(form.projektende) : '?'}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(1)} className="gap-2">
                  <IconArrowLeft size={16} />
                  {tx('Zurück')}
                </Button>
                <Button onClick={() => setStep(3)} disabled={!step2Valid} className="gap-2">
                  {tx('Weiter zur Finanzierung')}
                  <IconArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ── SCHRITT 3: Finanzierung ───────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="gesamtkosten">{tx('Gesamtkosten (€)')} <span className="text-destructive">*</span></Label>
                  <Input id="gesamtkosten" type="number" min="0" step="0.01" value={form.gesamtkosten} onChange={set('gesamtkosten')} placeholder="50000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="foerderbetrag">{tx('Beantragter Förderbetrag (€)')} <span className="text-destructive">*</span></Label>
                  <Input id="foerderbetrag" type="number" min="0" step="0.01" value={form.beantragter_foerderbetrag} onChange={set('beantragter_foerderbetrag')} placeholder="30000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="eigenanteil">{tx('Eigenanteil (€)')}</Label>
                  <Input id="eigenanteil" type="number" min="0" step="0.01" value={form.eigenanteil} onChange={set('eigenanteil')} placeholder="10000" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="drittmittel">{tx('Drittmittel (€, optional)')}</Label>
                  <Input id="drittmittel" type="number" min="0" step="0.01" value={form.drittmittel} onChange={set('drittmittel')} placeholder="0" />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="finanzierungsplan">{tx('Finanzierungsplan')}</Label>
                <Textarea
                  id="finanzierungsplan"
                  value={form.finanzierungsplan}
                  onChange={set('finanzierungsplan')}
                  placeholder={tx('Beschreibe, wie die Gesamtkosten aufgeteilt und gedeckt werden...')}
                  rows={4}
                />
              </div>

              {/* Budget-Tracker */}
              {gesamtkosten > 0 && (
                <BudgetTracker budget={gesamtkosten} booked={gedeckt} label={tx('Finanzierungsübersicht')} />
              )}

              {/* Deckungsstatus */}
              {gesamtkosten > 0 && (
                <div className={`rounded-2xl border p-4 flex items-start gap-3 ${luecke > 0 ? 'bg-destructive/5 border-destructive/20' : 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${luecke > 0 ? 'bg-destructive/10' : 'bg-green-100 dark:bg-green-900/30'}`}>
                    {luecke > 0
                      ? <IconAlertTriangle size={16} className="text-destructive" />
                      : <IconCheck size={16} className="text-green-600 dark:text-green-400" />
                    }
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-semibold ${luecke > 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                      {luecke > 0 ? tx('Deckungslücke') : tx('Vollständig gedeckt')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {luecke > 0
                        ? tx`${formatCurrency(luecke)} fehlen zur vollständigen Finanzierung.`
                        : tx`Die Gesamtkosten von ${formatCurrency(gesamtkosten)} sind vollständig abgedeckt.`
                      }
                    </p>
                  </div>
                  <span className={`font-bold text-lg shrink-0 ${luecke > 0 ? 'text-destructive' : 'text-green-700 dark:text-green-400'}`}>
                    {luecke > 0 ? `−${formatCurrency(Math.abs(luecke))}` : formatCurrency(0)}
                  </span>
                </div>
              )}

              {/* Finanzierungsstruktur */}
              {gesamtkosten > 0 && (
                <div className="rounded-2xl border bg-card p-4 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{tx('Finanzierungsstruktur')}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><IconCoin size={14} className="text-primary" /> {tx('Förderbetrag')}</span>
                    <span className="font-semibold">{formatCurrency(foerderbetrag)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><IconCoin size={14} className="text-muted-foreground" /> {tx('Eigenanteil')}</span>
                    <span className="font-semibold">{formatCurrency(eigenanteil)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><IconCoin size={14} className="text-muted-foreground" /> {tx('Drittmittel')}</span>
                    <span className="font-semibold">{formatCurrency(drittmittel)}</span>
                  </div>
                  <div className="border-t pt-2 flex items-center justify-between text-sm font-semibold">
                    <span>{tx('Gesamtkosten')}</span>
                    <span>{formatCurrency(gesamtkosten)}</span>
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={() => setStep(2)} className="gap-2">
                  <IconArrowLeft size={16} />
                  {tx('Zurück')}
                </Button>
                <Button onClick={() => setStep(4)} disabled={!step3Valid} className="gap-2">
                  {tx('Zur Zusammenfassung')}
                  <IconArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* ── SCHRITT 4: Prüfen & Einreichen ───────────────────────────── */}
          {step === 4 && (
            <div className="space-y-6">
              {/* Antragsteller-Zusammenfassung */}
              <div className="rounded-2xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconUser size={14} className="text-primary" />
                  </div>
                  <SectionTitle>{tx('Antragsteller')}</SectionTitle>
                </div>
                <div className="space-y-1.5">
                  <SummaryRow
                    label={tx('Name')}
                    value={[
                      ANREDE_OPTIONS.find(o => o.key === form.anrede)?.label,
                      form.antragsteller_vorname,
                      form.antragsteller_nachname,
                    ].filter(Boolean).join(' ')}
                  />
                  <SummaryRow label={tx('Organisation')} value={form.organisation} />
                  <SummaryRow label={tx('Rechtsform')} value={RECHTSFORM_OPTIONS.find(o => o.key === form.rechtsform)?.label ?? ''} />
                  <SummaryRow label={tx('E-Mail')} value={form.antragsteller_email} />
                  <SummaryRow label={tx('Telefon')} value={form.antragsteller_telefon} />
                  <SummaryRow
                    label={tx('Adresse')}
                    value={[form.strasse, form.hausnummer, form.plz, form.ort].filter(Boolean).join(' ')}
                  />
                </div>
              </div>

              {/* Projektdetails-Zusammenfassung */}
              <div className="rounded-2xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconBuildingCommunity size={14} className="text-primary" />
                  </div>
                  <SectionTitle>{tx('Projektdetails')}</SectionTitle>
                </div>
                <div className="space-y-1.5">
                  <SummaryRow label={tx('Projekttitel')} value={form.projekttitel} />
                  <SummaryRow label={tx('Förderkategorie')} value={FOERDERKATEGORIE_OPTIONS.find(o => o.key === form.foerderkategorie)?.label ?? ''} />
                  <SummaryRow label={tx('Förderprogramm')} value={form.foerderprogramm} />
                  <SummaryRow label={tx('Projektort')} value={form.projektort} />
                  <SummaryRow
                    label={tx('Laufzeit')}
                    value={
                      form.projektbeginn && form.projektende
                        ? `${formatDate(form.projektbeginn)} – ${formatDate(form.projektende)}`
                        : form.projektbeginn
                        ? tx`Ab ${formatDate(form.projektbeginn)}`
                        : ''
                    }
                  />
                  {form.projektkurzbeschreibung && (
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-sm block mb-1">{tx('Kurzbeschreibung')}</span>
                      <p className="text-sm text-foreground line-clamp-3">{form.projektkurzbeschreibung}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Finanzierungs-Zusammenfassung */}
              <div className="rounded-2xl border bg-card p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <IconCoin size={14} className="text-primary" />
                  </div>
                  <SectionTitle>{tx('Finanzierung')}</SectionTitle>
                </div>
                <div className="space-y-1.5">
                  <SummaryRow label={tx('Gesamtkosten')} value={gesamtkosten > 0 ? formatCurrency(gesamtkosten) : ''} />
                  <SummaryRow label={tx('Förderbetrag')} value={foerderbetrag > 0 ? formatCurrency(foerderbetrag) : ''} />
                  <SummaryRow label={tx('Eigenanteil')} value={eigenanteil > 0 ? formatCurrency(eigenanteil) : ''} />
                  <SummaryRow label={tx('Drittmittel')} value={drittmittel > 0 ? formatCurrency(drittmittel) : ''} />
                  {luecke > 0 && gesamtkosten > 0 && (
                    <SummaryRow label={tx('Deckungslücke')} value={tx`${formatCurrency(luecke)} fehlen noch`} />
                  )}
                </div>
              </div>

              {/* Datenschutz-Hinweis */}
              <div className="rounded-xl border bg-muted/40 p-3 flex items-start gap-2">
                <IconCheck size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {tx('Deine Daten werden ausschließlich zur Bearbeitung deines Förderantrags verwendet und nicht an Dritte weitergegeben. Der Antrag wird mit dem Status')} <span className="font-medium text-foreground">{tx('Eingegangen')}</span> {tx('angelegt.')}
                </p>
              </div>

              {/* Fehler */}
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
                  {tx('Zurück')}
                </Button>
                <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
                  {submitting ? (
                    <>{tx('Wird eingereicht…')}</>
                  ) : (
                    <>
                      <IconSend size={16} />
                      {tx('Antrag jetzt einreichen')}
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

        </IntentWizardShell>
      </div>
    </PublicShell>
  );
}
