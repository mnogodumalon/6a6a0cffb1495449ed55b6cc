import { lookupLabel } from '@/i18n';

// AUTOMATICALLY GENERATED TYPES - DO NOT EDIT

export type LookupValue = { key: string; label: string };
export type GeoLocation = { lat: number; long: number; info?: string };

export type AttachmentType = 'file' | 'note' | 'url' | 'json';
export interface Attachment {
  id: string;
  type: AttachmentType;
  label: string | null;
  value: string | null;
  active: boolean;
  createdat?: string | null;
  updatedat?: string | null;
}

export interface AttachmentInput {
  type: AttachmentType;
  label?: string;
  value: string;
  active?: boolean;
}

export interface Sachbearbeiter {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    abteilung?: string;
    funktion?: string;
  };
}

export interface Foerderantraege {
  record_id: string;
  /** The API field. */
  created_at: string;
  updated_at: string | null;
  /** Alias of created_at, filled by the read helpers. The API sends
   *  snake_case only — reading `createdat` off a raw record yields
   *  undefined, which type-checks and then crashes at runtime. */
  createdat: string;
  updatedat: string | null;
  fields: {
    anrede?: LookupValue;
    antragsteller_vorname?: string;
    antragsteller_nachname?: string;
    organisation?: string;
    rechtsform?: LookupValue;
    strasse?: string;
    hausnummer?: string;
    plz?: string;
    ort?: string;
    land?: string;
    antragsteller_email?: string;
    antragsteller_telefon?: string;
    antragsteller_website?: string;
    projekttitel?: string;
    projektkurzbeschreibung?: string;
    projektbeginn?: string; // Format: YYYY-MM-DD oder ISO String
    projektende?: string; // Format: YYYY-MM-DD oder ISO String
    projektort?: string;
    foerderprogramm?: string;
    foerderkategorie?: LookupValue;
    gesamtkosten?: number;
    beantragter_foerderbetrag?: number;
    eigenanteil?: number;
    drittmittel?: number;
    finanzierungsplan?: string;
    projektziele?: string;
    zielgruppe?: string;
    massnahmen?: string;
    erwartete_ergebnisse?: string;
    nachhaltigkeit?: string;
    datei_projektbeschreibung?: string;
    datei_kostenplan?: string;
    datei_weitere_anlagen?: string;
    eingangsdatum?: string; // Format: YYYY-MM-DD oder ISO String
    antragsstatus?: LookupValue;
    bearbeiter?: string; // applookup -> URL zu 'Sachbearbeiter' Record
    bearbeitungsnotizen?: string;
  };
}

export const APP_IDS = {
  SACHBEARBEITER: '6a6a0ce307bddb5f86863950',
  FOERDERANTRAEGE: '6a6a0ce7c5bcc98ee5003a98',
} as const;


export const LOOKUP_OPTIONS: Record<string, Record<string, {key: string, label: string}[]>> = {
  'foerderantraege': {
    anrede: [{ key: "herr", get label() { return lookupLabel('foerderantraege', 'anrede', "herr") ?? "Herr"; } }, { key: "frau", get label() { return lookupLabel('foerderantraege', 'anrede', "frau") ?? "Frau"; } }, { key: "divers", get label() { return lookupLabel('foerderantraege', 'anrede', "divers") ?? "Divers"; } }, { key: "keine_angabe", get label() { return lookupLabel('foerderantraege', 'anrede', "keine_angabe") ?? "Keine Angabe"; } }],
    rechtsform: [{ key: "ev", get label() { return lookupLabel('foerderantraege', 'rechtsform', "ev") ?? "Eingetragener Verein (e.V.)"; } }, { key: "gmbh", get label() { return lookupLabel('foerderantraege', 'rechtsform', "gmbh") ?? "GmbH"; } }, { key: "gbr", get label() { return lookupLabel('foerderantraege', 'rechtsform', "gbr") ?? "GbR"; } }, { key: "einzelperson", get label() { return lookupLabel('foerderantraege', 'rechtsform', "einzelperson") ?? "Einzelperson"; } }, { key: "stiftung", get label() { return lookupLabel('foerderantraege', 'rechtsform', "stiftung") ?? "Stiftung"; } }, { key: "sonstige", get label() { return lookupLabel('foerderantraege', 'rechtsform', "sonstige") ?? "Sonstige"; } }],
    foerderkategorie: [{ key: "kultur_bildung", get label() { return lookupLabel('foerderantraege', 'foerderkategorie', "kultur_bildung") ?? "Kultur & Bildung"; } }, { key: "soziales_integration", get label() { return lookupLabel('foerderantraege', 'foerderkategorie', "soziales_integration") ?? "Soziales & Integration"; } }, { key: "umwelt_nachhaltigkeit", get label() { return lookupLabel('foerderantraege', 'foerderkategorie', "umwelt_nachhaltigkeit") ?? "Umwelt & Nachhaltigkeit"; } }, { key: "wirtschaft_innovation", get label() { return lookupLabel('foerderantraege', 'foerderkategorie', "wirtschaft_innovation") ?? "Wirtschaft & Innovation"; } }, { key: "sport_gesundheit", get label() { return lookupLabel('foerderantraege', 'foerderkategorie', "sport_gesundheit") ?? "Sport & Gesundheit"; } }, { key: "sonstige_kategorie", get label() { return lookupLabel('foerderantraege', 'foerderkategorie', "sonstige_kategorie") ?? "Sonstige"; } }],
    antragsstatus: [{ key: "eingegangen", get label() { return lookupLabel('foerderantraege', 'antragsstatus', "eingegangen") ?? "Eingegangen"; } }, { key: "in_bearbeitung", get label() { return lookupLabel('foerderantraege', 'antragsstatus', "in_bearbeitung") ?? "In Bearbeitung"; } }, { key: "nachforderung", get label() { return lookupLabel('foerderantraege', 'antragsstatus', "nachforderung") ?? "Nachforderung"; } }, { key: "bewilligt", get label() { return lookupLabel('foerderantraege', 'antragsstatus', "bewilligt") ?? "Bewilligt"; } }, { key: "abgelehnt", get label() { return lookupLabel('foerderantraege', 'antragsstatus', "abgelehnt") ?? "Abgelehnt"; } }, { key: "zurueckgezogen", get label() { return lookupLabel('foerderantraege', 'antragsstatus', "zurueckgezogen") ?? "Zurückgezogen"; } }],
  },
};

// Optimistic LookupValue writes: never re-type a label — resolve the schema
// option instead (its label is a locale-aware getter; falls back to the key).
// WRONG: status: { key: 'offen', label: 'Offen' }   (frozen in one language)
// RIGHT: status: lookupOption('<appKey>', 'status', 'offen')
export function lookupOption(app: string, field: string, key: string): LookupValue {
  return LOOKUP_OPTIONS[app]?.[field]?.find(o => o.key === key) ?? { key, label: key };
}

export const FIELD_TYPES: Record<string, Record<string, string>> = {
  'sachbearbeiter': {
    'vorname': 'string/text',
    'nachname': 'string/text',
    'email': 'string/email',
    'telefon': 'string/tel',
    'abteilung': 'string/text',
    'funktion': 'string/text',
  },
  'foerderantraege': {
    'anrede': 'lookup/select',
    'antragsteller_vorname': 'string/text',
    'antragsteller_nachname': 'string/text',
    'organisation': 'string/text',
    'rechtsform': 'lookup/select',
    'strasse': 'string/text',
    'hausnummer': 'string/text',
    'plz': 'string/text',
    'ort': 'string/text',
    'land': 'string/text',
    'antragsteller_email': 'string/email',
    'antragsteller_telefon': 'string/tel',
    'antragsteller_website': 'string/url',
    'projekttitel': 'string/text',
    'projektkurzbeschreibung': 'string/textarea',
    'projektbeginn': 'date/date',
    'projektende': 'date/date',
    'projektort': 'string/text',
    'foerderprogramm': 'string/text',
    'foerderkategorie': 'lookup/select',
    'gesamtkosten': 'number',
    'beantragter_foerderbetrag': 'number',
    'eigenanteil': 'number',
    'drittmittel': 'number',
    'finanzierungsplan': 'string/textarea',
    'projektziele': 'string/textarea',
    'zielgruppe': 'string/textarea',
    'massnahmen': 'string/textarea',
    'erwartete_ergebnisse': 'string/textarea',
    'nachhaltigkeit': 'string/textarea',
    'datei_projektbeschreibung': 'file',
    'datei_kostenplan': 'file',
    'datei_weitere_anlagen': 'file',
    'eingangsdatum': 'date/date',
    'antragsstatus': 'lookup/select',
    'bearbeiter': 'applookup/select',
    'bearbeitungsnotizen': 'string/textarea',
  },
};

export const HUB_TOPOLOGY: Record<string, { field: string; entity: string }[]> = {
};

type StripLookup<T> = {
  [K in keyof T]: T[K] extends LookupValue | undefined ? string | LookupValue | undefined
    : T[K] extends LookupValue[] | undefined ? string[] | LookupValue[] | undefined
    : T[K];
};

// Helper Types for creating new records (lookup fields as plain strings for API)
export type CreateSachbearbeiter = StripLookup<Sachbearbeiter['fields']>;
export type CreateFoerderantraege = StripLookup<Foerderantraege['fields']>;