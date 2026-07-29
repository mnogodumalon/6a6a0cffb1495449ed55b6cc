import type { FormEnhancements } from './types';

export const formEnhancements: FormEnhancements = {
  fieldOrder: ['anrede', { row: ['antragsteller_vorname', 'antragsteller_nachname'] }, 'organisation', 'rechtsform', { row: ['strasse', 'hausnummer'], cols: '2fr 1fr' }, { row: ['plz', 'ort'], cols: '1fr 2fr' }, 'land', 'antragsteller_email', 'antragsteller_telefon', 'antragsteller_website', 'projekttitel', 'projektkurzbeschreibung', { row: ['projektbeginn', 'projektende'] }, 'projektort', 'foerderprogramm', 'foerderkategorie', 'gesamtkosten', 'beantragter_foerderbetrag', 'eigenanteil', 'drittmittel', 'finanzierungsplan', 'projektziele', 'zielgruppe', 'massnahmen', 'erwartete_ergebnisse', 'nachhaltigkeit', 'eingangsdatum', 'antragsstatus', 'bearbeiter', 'bearbeitungsnotizen'],
  defaults: {
    'eingangsdatum': { kind: 'today' },
    'projektbeginn': { kind: 'today' },
    'projektende': { kind: 'todayOffset', days: 14 },
    'antragsstatus': { kind: 'lookup', key: 'eingegangen', label: 'Eingegangen' },
  },
  computed: {
    'gesamtkosten': { op: 'add', left: { op: 'add', left: { kind: 'field', key: 'beantragter_foerderbetrag' }, right: { kind: 'field', key: 'eigenanteil' } }, right: { kind: 'field', key: 'drittmittel' } },
  },
};

export const computedDeps: Record<string, string[]> = {};

export const computedApplookupRefs: Record<string, {lookupKey: string}[]> = {};
