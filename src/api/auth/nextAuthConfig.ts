import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { authService, LoginRequest } from '../services/authService';
import { UserDto } from '@/types/api';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null;
        }

        try {
          const loginData: LoginRequest = {
            usernameOrEmail: credentials.username,
            password: credentials.password
          };

          const response = await authService.login(loginData);

          if (response.accessToken) {
            return {
              id: response.user.id,
              name: response.user.displayName,
              email: response.user.email,
              image: response.user.imageUrl,
              firstName: response.user.firstName,
              lastName: response.user.lastName,
              jobTitle: response.user.jobTitle,
              accessToken: response.accessToken,
              refreshToken: response.refreshToken,
              expiresIn: response.expiresIn,
              user: {
                ...response.user,
                permissions: response.user.permissions || []
              } as any
            };
          }

          return null;
        } catch (error) {
          console.error('Authentication error:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (account && user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        const rawExpiresIn = (user as any).expiresIn;
        const expiresInSeconds = typeof rawExpiresIn === 'number' ? rawExpiresIn : 0;
        token.expiresIn = expiresInSeconds;
        token.user = (user as any).user;
        // Store permissions in token
        token.permissions = (user as any).user?.permissions || [];
        token.accessTokenExpires = Date.now() + (expiresInSeconds * 1000);
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (token.accessTokenExpires && Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },

    async session({ session, token }) {
      // Pass tokens to session
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      if (token.user) {
        session.user = {
          ...token.user,
          permissions: (token as any).permissions || []
        } as any;
      }

      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    const response = await authService.refreshToken(token.refreshToken);

    return {
      ...token,
      accessToken: response.accessToken,
      accessTokenExpires: Date.now() + (response.expiresIn * 1000),
      refreshToken: response.refreshToken ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
