import { redirect } from "next/navigation";
import AuthPage from "@/components/AuthPage";
import { getCurrentAccount } from "@/lib/auth";
export const metadata = { title: "Masuk" };
export default async function LoginPage() {
  if (await getCurrentAccount()) redirect("/akun");
  return <AuthPage mode="login" />;
}
