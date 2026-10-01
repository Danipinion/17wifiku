// lib/auth.ts
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import { compare } from "bcrypt-ts";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        identifier: { label: "Username atau Nomor HP", type: "text" },
        password: { label: "Password", type: "password" },
      },
      // Logika otentikasi utama ada di sini
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials.password) {
          return null;
        }

        const identifier = credentials.identifier as string;

        // 1. Cari user di database berdasarkan nomor HP
        const user = await prisma.user.findFirst({
          where: {
            OR: [{ username: identifier }, { phone: identifier }],
          },
        });

        if (!user || !user.password) {
          return null;
        }

        if (user.status !== "ACTIVE") {
          console.log(`Login failed: User ${user.name} is INACTIVE.`);
          return null;
        }

        const isPasswordValid = await compare(
          credentials.password as string,
          user.password,
        );

        if (!isPasswordValid) {
          // Password salah
          return null;
        }

        // Web hanya mengizinkan ADMIN & PELANGGAN
        if (user.role !== "ADMIN" && user.role !== "PELANGGAN") {
          console.log(
            `Login failed: User ${user.name} is ${user.role} and cannot login to Web.`,
          );
          return null;
        }

        // 3. Jika semua valid, return object user
        // Object ini akan di-encode ke dalam JWT
        return {
          id: user.id,
          name: user.name,
          phone: user.phone,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    // Callback ini dipanggil setiap kali JWT dibuat atau di-update
    jwt({ token, user }) {
      if (user) {
        // Saat pertama kali login, tambahkan role dan id ke token
        token.role = user.role;
        token.id = user.id as string;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
});
