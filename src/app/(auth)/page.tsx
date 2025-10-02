import SignInForm from "@/components/auth/SignInForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Survey | Login",
  description: "Access your survey dashboard",
};

export default function LoginPage() {
  return <SignInForm />;
}
