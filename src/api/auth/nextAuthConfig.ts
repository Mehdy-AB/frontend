import { NextAuthOptions } from 'next-auth';
import KeycloakProvider from 'next-auth/providers/keycloak';

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID || 'dms-front-app',
      clientSecret: process.env.KEYCLOAK_SECRET || 'fbOTgjSIZPHi1Cl6tQ2pFGPFa9fPr6Zi',
      issuer: process.env.KEYCLOAK_ISSUER || 'http://localhost:9090/realms/AeB_Dms',
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign in
      if (account?.access_token && account.refresh_token) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : Date.now() + 60 * 60 * 1000; // 1 hour default
        
        // Decode the access token to extract user information
        try {
          const payload = JSON.parse(atob(account.access_token.split('.')[1]));
          
          // Extract user information from the access token
          token.sub = payload.sub || payload.user_id;
          token.name = payload.name || payload.preferred_username;
          token.email = payload.email;
          token.given_name = payload.given_name;
          token.family_name = payload.family_name;
          token.preferred_username = payload.preferred_username;
          
        } catch (error) {
          console.error('Error decoding access token:', error);
        }
        
        return token;
      }

      // Return previous token if the access token has not expired yet
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Access token has expired, try to update it
      return await refreshAccessToken(token);
    },
    
    async session({ session, token }) {
      // Pass tokens to session
      session.accessToken = token.accessToken;
      session.refreshToken = token.refreshToken;
      
      // Populate user object with decoded information
      if (session.user) {
        const user = session.user as any;
        user.id = token.sub || '';
        user.name = token.name || token.preferred_username || '';
        user.email = token.email || '';
        user.given_name = token.given_name || '';
        user.family_name = token.family_name || '';
        user.preferred_username = token.preferred_username || '';
      }
      
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
};

/**
 * Refresh the access token using the refresh token
 */
async function refreshAccessToken(token: any) {
  try {
    const issuer = process.env.KEYCLOAK_ISSUER || 'http://localhost:9090/realms/AeB_Dms';
    const clientId = process.env.KEYCLOAK_ID || 'dms-backend-app';
    const clientSecret = 'fbOTgjSIZPHi1Cl6tQ2pFGPFa9fPr6Zi';

    const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken, // Fall back to old refresh token
    };
  } catch (error) {
    console.error('Error refreshing access token:', error);

    return {
      ...token,
      error: 'RefreshAccessTokenError',
    };
  }
}
