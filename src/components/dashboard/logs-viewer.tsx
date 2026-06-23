"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LogView } from "@/lib/logs/types";

type Filter = "all" | "api" | "webhook";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "api", label: "API" },
  { key: "webhook", label: "Webhooks" },
];

function statusClass(status: number): string {
  if (status === 0 || status >= 500) return "bg-destructive/10 text-destructive";
  if (status >= 400) return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function LogsViewer({ logs }: { logs: LogView[] }) {
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? logs : logs.filter((l) => l.type === filter)),
    [logs, filter],
  );

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <CardTitle>Journal d&apos;activité</CardTitle>
          <CardDescription>
            Les {logs.length} derniers événements (requêtes API & livraisons de
            webhooks).
          </CardDescription>
        </div>
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f.key}
              variant={filter === f.key ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="px-0">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun événement pour l&apos;instant. Les appels API et les webhooks
            apparaîtront ici.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Cible</TableHead>
                <TableHead>Détail</TableHead>
                <TableHead className="text-right">Statut</TableHead>
                <TableHead className="text-right">Durée</TableHead>
                <TableHead className="text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {l.type === "api" ? "API" : "Webhook"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.method}</TableCell>
                  <TableCell className="max-w-[220px] truncate font-mono text-xs">
                    {l.target}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {l.detail ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge
                      variant="outline"
                      className={`border-transparent tabular-nums ${statusClass(l.status)}`}
                    >
                      {l.status === 0 ? "—" : l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-xs tabular-nums">
                    {l.durationMs != null ? `${l.durationMs} ms` : "—"}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground tabular-nums">
                    {formatDate(l.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
