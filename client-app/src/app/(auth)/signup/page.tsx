import { SignupForm } from "@/components/modules/auth/signup-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign Up - Nionify",
  description: "Create a new Nionify account",
};

export default function SignupPage() {
  return <SignupForm />;
}
