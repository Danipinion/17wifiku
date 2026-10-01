import { LoginForm } from "@/components/modules/auth/login-form";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login - Nionify",
  description: "Login to your Nionify account",
};

export default function LoginPage() {
  return <LoginForm />;
}
