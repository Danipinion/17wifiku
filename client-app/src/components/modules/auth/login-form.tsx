"use client";

import { useActionState } from "react";
import { login } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, {});

  return (
    <Card className="border-none shadow-xl bg-background/80 backdrop-blur-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-primary">
          Nionify
        </CardTitle>
        <CardDescription className="text-center">
          Enter your Customer ID or Phone to login
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Customer ID or Phone</Label>
            <Input
              id="identifier"
              name="identifier"
              placeholder="CUST-1234 or 0812..."
              required
              className="bg-background/50"
            />
            {state?.errors?.identifier && (
              <p className="text-sm text-destructive">
                {state.errors.identifier}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              required
              className="bg-background/50"
            />
            {state?.errors?.password && (
              <p className="text-sm text-destructive">
                {state.errors.password}
              </p>
            )}
          </div>
          {state?.message && (
            <p className="text-sm text-destructive text-center">
              {state.message}
            </p>
          )}
          <Button
            type="submit"
            className="w-full font-bold"
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              "Login"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <a href="/signup" className="text-primary hover:underline">
            Sign up
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
