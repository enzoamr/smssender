import { redirect } from "next/navigation";

/**
 * La landing publique n'est pas le sujet pour l'instant : on redirige vers
 * le tableau de bord. (À remplacer par la vraie home marketing plus tard.)
 */
export default function Home() {
  redirect("/dashboard");
}
