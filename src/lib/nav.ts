import {
  BarChart3,
  Building2,
  CreditCard,
  KeyRound,
  LayoutDashboard,
  Megaphone,
  MessageSquare,
  ScrollText,
  Send,
  Settings,
  ShieldCheck,
  Users,
  Webhook,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const clientNav: NavGroup[] = [
  {
    label: "Plateforme",
    items: [
      { title: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
      { title: "Envoyer un SMS", href: "/dashboard/send", icon: Send },
      { title: "Messages", href: "/dashboard/messages", icon: MessageSquare },
      { title: "Contacts", href: "/dashboard/contacts", icon: Users },
      { title: "Campagnes", href: "/dashboard/campaigns", icon: Megaphone },
    ],
  },
  {
    label: "Développeurs",
    items: [
      { title: "Clés API", href: "/dashboard/api-keys", icon: KeyRound },
      { title: "Webhooks", href: "/dashboard/webhooks", icon: Webhook },
      { title: "Logs", href: "/dashboard/logs", icon: ScrollText },
    ],
  },
  {
    label: "Compte",
    items: [
      { title: "Facturation", href: "/dashboard/billing", icon: CreditCard },
      { title: "Paramètres", href: "/dashboard/settings", icon: Settings },
    ],
  },
];

export const adminNav: NavGroup[] = [
  {
    label: "Administration",
    items: [
      { title: "Vue d'ensemble", href: "/admin", icon: BarChart3 },
      { title: "Comptes clients", href: "/admin/accounts", icon: Building2 },
      { title: "Messages", href: "/admin/messages", icon: MessageSquare },
      { title: "Modération", href: "/admin/moderation", icon: ShieldCheck },
    ],
  },
];

const allItems = [...clientNav, ...adminNav].flatMap((group) => group.items);

/** Renvoie le titre lisible d'une route pour le fil d'Ariane / la top bar. */
export function getNavTitle(pathname: string): string {
  const exact = allItems.find((item) => item.href === pathname);
  if (exact) return exact.title;

  const prefix = allItems
    .filter((item) => pathname.startsWith(item.href))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (prefix) return prefix.title;

  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  return last.charAt(0).toUpperCase() + last.slice(1);
}
