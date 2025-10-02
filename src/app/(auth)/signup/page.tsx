import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: " Survey | Sign up",
  description: "This is Next.js SignUp Page",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
