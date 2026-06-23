/**
 * Réglages d'un compte (organisation, expéditeur par défaut…).
 * Un document par compte, indépendant de Firebase Auth.
 */

export interface AccountSettings {
  accountId: string;
  organizationName: string;
  /** Expéditeur (sender ID) pré-rempli lors des envois. */
  defaultSender: string;
  updatedAt: string;
}

export interface AccountSettingsView {
  organizationName: string;
  defaultSender: string;
}
