"use server";

import { eq, or } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "@/lib/session";
import {
  LoginFormSchema,
  SignupFormSchema,
  FormState,
} from "@/lib/definitions";

export async function login(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = LoginFormSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { identifier, password } = validatedFields.data;

  try {
    const user = await db.query.users.findFirst({
      where: or(eq(users.phone, identifier), eq(users.customerId, identifier)),
    });

    if (!user) {
      return {
        message: "Invalid credentials.",
      };
    }

    const passwordsMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordsMatch) {
      return {
        message: "Invalid credentials.",
      };
    }

    const session = await getSession();
    session.userId = user.id;
    session.name = user.name;
    session.isLoggedIn = true;
    await session.save();
  } catch (error) {
    console.error("Login error:", error);
    return {
      message: "Database connection failed.",
    };
  }

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}

// Simple signup for testing/initialization
export async function signup(
  state: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = SignupFormSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    referralCode: formData.get("referralCode"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { name, phone, password } = validatedFields.data;

  try {
    // Check if phone exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.phone, phone),
    });

    if (existingUser) {
      return {
        errors: {
          phone: ["Phone number already in use."],
        },
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a random referral code for the new user
    const newReferralCode = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    await db.insert(users).values({
      name,
      phone,
      passwordHash: hashedPassword,
      referralCode: newReferralCode,
      customerId: `CUST-${Date.now()}`, // Auto-generate for now
      // Handle referral code logic here (reward recommender) if implemented
    });
  } catch (error) {
    console.error("Signup error:", error);
    return {
      message: "Failed to create user.",
    };
  }

  redirect("/login");
}
