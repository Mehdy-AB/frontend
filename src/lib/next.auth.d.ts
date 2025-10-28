import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT as DefaultJWT } from "next-auth/jwt"
import { UserDto } from "@/types/api"

declare module "next-auth" {
  interface Session extends DefaultSession {
    accessToken?: string
    refreshToken?: string
    user: UserDto & {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      firstName?: string | null
      lastName?: string | null
      jobTitle?: string | null
    }
  }

  interface User extends DefaultUser {
    accessToken?: string
    refreshToken?: string
    expiresIn?: number
    firstName?: string
    lastName?: string
    jobTitle?: string
    user?: UserDto
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    refreshToken?: string
    expiresIn?: number
    accessTokenExpires?: number
    user?: UserDto
  }
}
