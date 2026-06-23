import type { Encoding } from "./types";

/**
 * Jeu de caractères GSM 03.38 (alphabet de base + extensions).
 * Si un message ne contient que ces caractères, il est encodé en GSM-7
 * (160 caractères/segment). Sinon, il bascule en UCS-2 (70 caractères/segment).
 */
const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ ÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXTENSION = "^{}\\[~]|€";

const GSM7_CHARS = new Set([...GSM7_BASIC, ...GSM7_EXTENSION]);

export interface SegmentInfo {
  encoding: Encoding;
  /** Longueur "facturée" (les caractères d'extension GSM comptent double). */
  length: number;
  characters: number;
  segmentCount: number;
  /** Nombre de caractères restants avant d'ajouter un segment supplémentaire. */
  remaining: number;
}

function isGsm7(text: string): boolean {
  for (const char of text) {
    if (!GSM7_CHARS.has(char)) return false;
  }
  return true;
}

/**
 * Calcule l'encodage et le nombre de segments d'un message.
 * Règles standards SMS :
 *  - GSM-7 : 160 car. sur 1 segment, puis 153 car./segment (en-tête de concaténation)
 *  - UCS-2 : 70 car. sur 1 segment, puis 67 car./segment
 */
export function computeSegments(text: string): SegmentInfo {
  const characters = [...text].length;

  if (isGsm7(text)) {
    // Les caractères d'extension occupent 2 emplacements.
    let length = 0;
    for (const char of text) {
      length += GSM7_EXTENSION.includes(char) ? 2 : 1;
    }
    const single = 160;
    const multi = 153;
    const segmentCount = length <= single ? 1 : Math.ceil(length / multi);
    const capacity = segmentCount === 1 ? single : segmentCount * multi;
    return {
      encoding: "STANDARD",
      length,
      characters,
      segmentCount: Math.max(1, segmentCount),
      remaining: capacity - length,
    };
  }

  const single = 70;
  const multi = 67;
  const length = characters;
  const segmentCount = length <= single ? 1 : Math.ceil(length / multi);
  const capacity = segmentCount === 1 ? single : segmentCount * multi;
  return {
    encoding: "UNICODE",
    length,
    characters,
    segmentCount: Math.max(1, segmentCount),
    remaining: capacity - length,
  };
}
