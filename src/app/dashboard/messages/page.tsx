import Link from "next/link";
import { Send } from "lucide-react";
import { MessagesTable } from "@/components/dashboard/messages-table";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DEMO_ACCOUNT_ID } from "@/lib/config";
import { listMessages } from "@/lib/messaging/service";

export default async function MessagesPage() {
  const messages = await listMessages(DEMO_ACCOUNT_ID, 100);
  const delivered = messages.filter((m) => m.status === "DELIVERED");
  const failed = messages.filter(
    (m) => m.status === "FAILED" || m.status === "UNDELIVERED",
  );
  const pending = messages.filter((m) =>
    ["QUEUED", "SENDING", "SENT"].includes(m.status),
  );

  return (
    <>
      <PageHeader
        title="Messages"
        description="Historique complet de vos envois et de leur statut de livraison."
        actions={
          <Button render={<Link href="/dashboard/send" />}>
            <Send />
            Nouveau message
          </Button>
        }
      />

      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">Tous ({messages.length})</TabsTrigger>
          <TabsTrigger value="delivered">Délivrés ({delivered.length})</TabsTrigger>
          <TabsTrigger value="pending">En cours ({pending.length})</TabsTrigger>
          <TabsTrigger value="failed">Échecs ({failed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <Card>
            <CardContent className="px-0">
              <MessagesTable messages={messages} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="delivered">
          <Card>
            <CardContent className="px-0">
              <MessagesTable messages={delivered} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="pending">
          <Card>
            <CardContent className="px-0">
              <MessagesTable messages={pending} />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="failed">
          <Card>
            <CardContent className="px-0">
              <MessagesTable messages={failed} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
