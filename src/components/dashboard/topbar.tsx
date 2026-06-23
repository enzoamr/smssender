"use client";

import { usePathname } from "next/navigation";
import { Wallet } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { getNavTitle } from "@/lib/nav";

export function Topbar({ credits }: { credits?: number }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 flex h-14 shrink-0 items-center gap-2 border-b bg-background/70 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-1 data-[orientation=vertical]:h-4"
      />
      <h1 className="text-sm font-medium">{getNavTitle(pathname)}</h1>
      <div className="ml-auto flex items-center gap-2">
        {credits != null && (
          <Badge variant="secondary" className="gap-1 font-normal tabular-nums">
            <Wallet className="size-3" />
            {credits.toLocaleString("fr-FR")} crédits
          </Badge>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}
