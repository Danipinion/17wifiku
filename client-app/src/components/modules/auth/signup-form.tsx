"use client";

import { useActionState } from "react";
import { signup } from "@/actions/auth";
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

export function SignupForm() {
  const [state, action, isPending] = useActionState(signup, {});

  return (
    <Card className="border-none shadow-xl bg-background/80 backdrop-blur-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center text-primary">
          Create Account
        </CardTitle>
        <CardDescription className="text-center">
          Join Nionify today
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="John Doe"
              required
              className="bg-background/50"
            />
            {state?.errors?.name && (
              <p className="text-sm text-destructive">{state.errors.name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              placeholder="0812..."
              required
              className="bg-background/50"
            />
            {state?.errors?.phone && (
              <p className="text-sm text-destructive">{state.errors.phone}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
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
          <div className="space-y-2">
            <Label htmlFor="referralCode">Referral Code (Optional)</Label>
            <Input
              id="referralCode"
              name="referralCode"
              placeholder="FRIEND123"
              className="bg-background/50"
            />
            {state?.errors?.referralCode && (
              <p className="text-sm text-destructive">
                {state.errors.referralCode}
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
              "Create Account"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <a href="/login" className="text-primary hover:underline">
            Login
          </a>
        </div>
      </CardFooter>
    </Card>
  );
}
