"use server";

import { db } from "@/db";
import { tickets } from "@/db/schema";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const TicketSchema = z.object({
  subject: z.string().min(5, { message: "Subject too short" }),
  category: z.enum(["slow_internet", "no_connection", "billing", "other"]),
  message: z.string().min(10, { message: "Please provide more details" }),
});

export type TicketFormState = {
  errors?: {
    subject?: string[];
    category?: string[];
    message?: string[];
  };
  message?: string;
  success?: boolean;
};

export async function createTicket(
  prevState: TicketFormState,
  formData: FormData
): Promise<TicketFormState> {
  const session = await getSession();
  if (!session.userId) return { message: "Unauthorized" };

  const validatedFields = TicketSchema.safeParse({
    subject: formData.get("subject"),
    category: formData.get("category"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { subject, category, message } = validatedFields.data;

  try {
    await db.insert(tickets).values({
      userId: session.userId,
      subject: `[${category.toUpperCase().replace("_", " ")}] ${subject}`,
      message,
      status: "open",
      priority: category === "no_connection" ? "high" : "medium",
    });

    revalidatePath("/support");
    return { success: true, message: "Ticket created successfully!" };
  } catch (error) {
    console.error("Create ticket error:", error);
    return { message: "Failed to create ticket" };
  }
}
