"use server";

import { db } from "@/db";
import { referrals, users } from "@/db/schema";
import { getSession } from "@/lib/session";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getReferralData() {
  const session = await getSession();
  if (!session.userId) return null;

  const user = await db.query.users.findFirst({
    where: eq(users.id, session.userId),
    columns: {
      referralCode: true,
      points: true,
      balance: true,
    },
    with: {
      referralsSent: {
        orderBy: [desc(referrals.createdAt)],
        with: {
          referee: {
            columns: {
              name: true,
              createdAt: true,
            },
          },
        },
      },
    },
  });

  return user;
}
