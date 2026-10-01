import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export type SessionData = {
  isLoggedIn: boolean;
  userId: number;
  name: string;
  role?: string;
};

export const defaultSession: SessionData = {
  isLoggedIn: false,
  userId: 0,
  name: "",
};

export const sessionOptions = {
  password:
    process.env.IRON_SESSION_PASSWORD ||
    "complex_password_at_least_32_characters_long",
  cookieName: "nionify_session",
  cookieOptions: {
    // secure only works in `https` environments
    // if your localhost is not on `https`, then use: `secure: process.env.NODE_ENV === "production"`
    secure: process.env.NODE_ENV === "production",
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}
