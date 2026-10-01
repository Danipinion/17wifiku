import { z } from "zod";

export const SignupFormSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long." })
    .trim(),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 characters." })
    .trim(),
  password: z
    .string()
    .min(8, { message: "Be at least 8 characters long" })
    .regex(/[a-zA-Z]/, { message: "Contain at least one letter." })
    .regex(/[0-9]/, { message: "Contain at least one number." })
    .trim(),
  referralCode: z.string().optional(),
});

export const LoginFormSchema = z.object({
  identifier: z
    .string()
    .min(1, { message: "Customer ID or Phone Number is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

export type FormState = {
  errors?: {
    name?: string[];
    phone?: string[];
    password?: string[];
    identifier?: string[];
    referralCode?: string[];
  };
  message?: string;
};
