"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  BellOff,
  BellRing,
  Loader2,
  Search,
  Trash2,
  Upload,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import {
  addContactAction,
  deleteContactAction,
  importContactsAction,
  toggleContactStatusAction,
  type ContactActionState,
} from "@/app/dashboard/contacts/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { ContactView } from "@/lib/contacts/types";

const initialState: ContactActionState = { status: "idle", message: "" };

export function ContactsManager({
  initialContacts,
}: {
  initialContacts: ContactView[];
}) {
  const [addState, addAction, addPending] = useActionState(
    addContactAction,
    initialState,
  );
  const [importState, importAction, importPending] = useActionState(
    importContactsAction,
    initialState,
  );

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [list, setList] = useState("");
  const [bulk, setBulk] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (addState.status === "success") {
      toast.success(addState.message);
      setPhone("");
      setName("");
      setList("");
    } else if (addState.status === "error") {
      toast.error(addState.message);
    }
  }, [addState]);

  useEffect(() => {
    if (importState.status === "success") {
      toast.success(importState.message);
      setBulk("");
    } else if (importState.status === "error") {
      toast.error(importState.message);
    }
  }, [importState]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return initialContacts;
    return initialContacts.filter(
      (c) =>
        c.phone.toLowerCase().includes(q) ||
        (c.name?.toLowerCase().includes(q) ?? false) ||
        (c.list?.toLowerCase().includes(q) ?? false),
    );
  }, [initialContacts, query]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Ajout manuel */}
        <Card>
          <CardHeader>
            <CardTitle>Ajouter un contact</CardTitle>
            <CardDescription>
              Un destinataire au format international.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={addAction} className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Numéro</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33612345678"
                  required
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom (optionnel)</Label>
                  <Input
                    id="name"
                    name="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="list">Liste (optionnel)</Label>
                  <Input
                    id="list"
                    name="list"
                    value={list}
                    onChange={(e) => setList(e.target.value)}
                    placeholder="Newsletter"
                  />
                </div>
              </div>
              <Button
                type="submit"
                disabled={addPending || phone.trim().length === 0}
              >
                {addPending ? <Loader2 className="animate-spin" /> : <UserPlus />}
                Ajouter
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Import en masse */}
        <Card>
          <CardHeader>
            <CardTitle>Importer en masse</CardTitle>
            <CardDescription>
              Une ligne par contact :{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">numéro</code>{" "}
              ou{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">
                numéro,nom,liste
              </code>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form action={importAction} className="space-y-3">
              <Textarea
                name="bulk"
                value={bulk}
                onChange={(e) => setBulk(e.target.value)}
                placeholder={"+33612345678,Jean,Newsletter\n+33698765432"}
                className="min-h-28 font-mono text-sm"
              />
              <Button
                type="submit"
                variant="outline"
                disabled={importPending || bulk.trim().length === 0}
              >
                {importPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Upload />
                )}
                Importer
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Liste des contacts */}
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Vos contacts ({initialContacts.length})</CardTitle>
            <CardDescription>
              Recherchez, désinscrivez (STOP) ou supprimez un contact.
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher…"
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {initialContacts.length === 0
                ? "Aucun contact. Ajoutez-en un ci-dessus."
                : "Aucun résultat."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Liste</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ContactRow({ contact }: { contact: ContactView }) {
  const [pending, startTransition] = useTransition();
  const unsubscribed = contact.status === "unsubscribed";

  function toggleStatus() {
    startTransition(async () => {
      const next = unsubscribed ? "subscribed" : "unsubscribed";
      const { ok } = await toggleContactStatusAction(contact.id, next);
      if (ok) {
        toast.success(
          next === "unsubscribed" ? "Contact désinscrit." : "Contact réabonné.",
        );
      } else {
        toast.error("Action impossible.");
      }
    });
  }

  function remove() {
    if (!window.confirm("Supprimer définitivement ce contact ?")) return;
    startTransition(async () => {
      const { ok } = await deleteContactAction(contact.id);
      if (ok) toast.success("Contact supprimé.");
      else toast.error("Suppression impossible.");
    });
  }

  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{contact.phone}</TableCell>
      <TableCell>
        {contact.name ?? <span className="text-muted-foreground">—</span>}
      </TableCell>
      <TableCell>
        {contact.list ? (
          <Badge variant="secondary">{contact.list}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className={
            unsubscribed
              ? "border-transparent bg-destructive/10 text-destructive"
              : "border-transparent bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          }
        >
          {unsubscribed ? "Désinscrit" : "Abonné"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleStatus}
            disabled={pending}
            title={unsubscribed ? "Réabonner" : "Désinscrire (STOP)"}
          >
            {pending ? (
              <Loader2 className="animate-spin" />
            ) : unsubscribed ? (
              <BellRing />
            ) : (
              <BellOff />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={remove}
            disabled={pending}
            title="Supprimer"
          >
            <Trash2 />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
