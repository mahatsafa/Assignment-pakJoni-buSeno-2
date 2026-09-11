import { redirect } from "next/navigation";
import AuthPage from "@/components/AuthPage";
import { getCurrentAccount } from "@/lib/auth";
export const metadata = { title: "Daftar Akun" };
export default async function RegisterPage() {
  if (await getCurrentAccount()) redirect("/akun");
  return <AuthPage mode="register" />;
}
