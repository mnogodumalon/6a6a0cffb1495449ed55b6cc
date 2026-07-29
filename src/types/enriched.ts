import type { Foerderantraege } from './app';

export type EnrichedFoerderantraege = Foerderantraege & {
  bearbeiterName: string;
};
