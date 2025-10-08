import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    refreshToken?: string
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      given_name?: string
      family_name?: string
      preferred_username?: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    refreshToken?: string
    sub?: string
    name?: string
    email?: string
    given_name?: string
    family_name?: string
    preferred_username?: string
  }
}
