import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata = { title: "Connexion" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user && !user.demo) redirect("/dashboard");

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Bon retour 👋</CardTitle>
        <CardDescription>Connectez-vous à votre espace Sendly</CardDescription>
      </CardHeader>
      <CardContent>
        <AuthForm mode="login" />
      </CardContent>
    </Card>
  );
}
