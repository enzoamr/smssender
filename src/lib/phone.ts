/**
 * Normalisation/validation des numéros de téléphone (format E.164).
 * Partagé entre les contacts et le moteur d'envoi.
 */

/**
 * Nettoie un numéro et le valide au format E.164 (`+` suivi de 8 à 15 chiffres).
 * Renvoie le numéro normalisé, ou `null` si invalide.
 */
export function normalizePhone(input: string): string | null {
  const cleaned = input.replace(/[\s().\-]/g, "");
  if (!/^\+\d{8,15}$/.test(cleaned)) return null;
  return cleaned;
}
