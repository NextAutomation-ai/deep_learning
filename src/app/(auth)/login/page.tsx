import { redirect } from "next/navigation";

export default async function LoginPage() {
  // Auth hidden — redirect to dashboard directly
  redirect("/dashboard");
}
