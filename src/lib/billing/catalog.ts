/**
 * Catalogue des offres : abonnements mensuels (plans) et packs de crédits.
 *
 * Le nombre de crédits accordé est défini ICI (source de vérité métier). Le prix
 * réel facturé vient de l'objet Price Stripe (référencé par son id via une
 * variable d'environnement) — le libellé `price` n'est qu'indicatif pour l'UI et
 * doit refléter le montant configuré dans Stripe.
 *
 * Pour activer une offre : créez le Produit + Price dans Stripe, puis renseignez
 * la variable d'env correspondante (ex. STRIPE_PRICE_PRO). Une offre sans Price
 * id configuré est simplement masquée dans l'UI.
 */

export type OfferKind = "plan" | "pack";

export interface Offer {
  id: string;
  kind: OfferKind;
  name: string;
  /** Crédits accordés (par mois pour un plan, une fois pour un pack). */
  credits: number;
  /** Libellé de prix indicatif (le montant réel vient de Stripe). */
  price: string;
  description: string;
  /** Variable d'env contenant le Price id Stripe. */
  priceEnv: string;
}

/** Abonnements mensuels (mode subscription). */
export const PLANS: Offer[] = [
  {
    id: "starter",
    kind: "plan",
    name: "Starter",
    credits: 2_000,
    price: "19 €/mois",
    description: "2 000 crédits/mois. Idéal pour démarrer.",
    priceEnv: "STRIPE_PRICE_STARTER",
  },
  {
    id: "pro",
    kind: "plan",
    name: "Pro",
    credits: 10_000,
    price: "79 €/mois",
    description: "10 000 crédits/mois. Pour un usage régulier.",
    priceEnv: "STRIPE_PRICE_PRO",
  },
  {
    id: "business",
    kind: "plan",
    name: "Business",
    credits: 50_000,
    price: "299 €/mois",
    description: "50 000 crédits/mois. Gros volumes.",
    priceEnv: "STRIPE_PRICE_BUSINESS",
  },
];

/** Packs de crédits (achat ponctuel, mode payment). */
export const PACKS: Offer[] = [
  {
    id: "pack_1k",
    kind: "pack",
    name: "1 000 crédits",
    credits: 1_000,
    price: "12 €",
    description: "Recharge ponctuelle.",
    priceEnv: "STRIPE_PRICE_PACK_1K",
  },
  {
    id: "pack_5k",
    kind: "pack",
    name: "5 000 crédits",
    credits: 5_000,
    price: "49 €",
    description: "La recharge la plus populaire.",
    priceEnv: "STRIPE_PRICE_PACK_5K",
  },
  {
    id: "pack_20k",
    kind: "pack",
    name: "20 000 crédits",
    credits: 20_000,
    price: "169 €",
    description: "Pour les gros volumes ponctuels.",
    priceEnv: "STRIPE_PRICE_PACK_20K",
  },
];

const ALL_OFFERS = [...PLANS, ...PACKS];

/** Price id Stripe configuré pour une offre (ou null si absent). */
export function priceIdFor(offer: Offer): string | null {
  return process.env[offer.priceEnv] || null;
}

/** Offre par son id de catalogue. */
export function findOffer(id: string): Offer | null {
  return ALL_OFFERS.find((o) => o.id === id) ?? null;
}

/** Offre correspondant à un Price id Stripe (pour le webhook). */
export function findOfferByPriceId(priceId: string): Offer | null {
  return ALL_OFFERS.find((o) => priceIdFor(o) === priceId) ?? null;
}

/** Nom lisible d'un plan à partir de son id (pour l'affichage). */
export function planName(planId: string | null): string | null {
  if (!planId) return null;
  return PLANS.find((p) => p.id === planId)?.name ?? planId;
}
