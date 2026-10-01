// /next-auth.d.ts

import { Role } from "@prisma/client";
import { DefaultSession, User } from "next-auth";
import { JWT } from "next-auth/jwt";

/**
 * Memperluas tipe JWT bawaan dengan properti kustom Anda.
 */
declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}

/**
 * Memperluas tipe Session bawaan dengan properti kustom Anda.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"]; // Menggabungkan dengan tipe user bawaan (name, email, image)
  }

  /**
   * Memperluas tipe User bawaan yang digunakan dalam callback.
   * Ini adalah bagian yang secara langsung memperbaiki error Anda.
   */
  interface User {
    role: Role;
  }
}
