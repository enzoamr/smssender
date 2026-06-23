import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { APP_NAME } from "@/lib/config";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted/30 p-4">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <MessageCircle className="size-4" />
        </div>
        {APP_NAME}
      </Link>
      <div className="w-full max-w-sm">{children}</div>
      <p className="text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} {APP_NAME}. Tous droits réservés.
      </p>
    </div>
  );
}
