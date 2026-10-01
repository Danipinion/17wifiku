import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSession } from "./session";

export const verifySession = cache(async () => {
  const session = await getSession();

  if (!session.isLoggedIn) {
    redirect("/login");
  }

  return { isAuth: true, userId: session.userId };
});

export const getUser = cache(async () => {
  const session = await getSession();
  if (!session || !session.userId) return null;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
      columns: {
        id: true,
        name: true,
        phone: true,
        customerId: true,
        // Re-checking schema: users has: id, name, phone, passwordHash, customerId, referralCode, balance, points, createdAt.
        // So no email.
      },
    });

    return user;
  } catch (error) {
    console.error("Failed to fetch user", error);
    return null;
  }
});
