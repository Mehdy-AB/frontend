import { getSession, signOut } from 'next-auth/react';

export interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type?: string;
}

export class TokenManager {
  private static instance: TokenManager;
  private isRefreshing = false;
  private waiting: Array<{
    resolve: (value?: any) => void;
    reject: (err?: any) => void;
  }> = [];

  // in-memory cache
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private accessTokenExpires: number = 0; // ms epoch

  private constructor() {
    // listen for session refresh events (emit this from refresh logic that updates NextAuth session)
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:refresh', this.handleAuthRefreshEvent);
    }
  }

  public static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  // Call once on app init (eg in _app.tsx) to pre-load tokens from NextAuth session
  public async init(): Promise<void> {
    // Only call getSession once on init; subsequent reads should use in-memory cache
    try {
      console.log('TokenManager: Initializing...');
      const session = await getSession();
      if (session?.accessToken) {
        this.accessToken = session.accessToken;
        this.refreshToken = session.refreshToken ?? null;
        // If you populated expires on session via callbacks, set it here; otherwise decode token
        this.accessTokenExpires = this.extractExpiryFromToken(this.accessToken) || Date.now() + 55 * 60 * 1000;
        console.log('TokenManager: Initialized with token, expires at:', new Date(this.accessTokenExpires).toISOString());
      } else {
        console.log('TokenManager: No access token found in session');
      }
    } catch (err) {
      console.warn('TokenManager.init(): failed to get session', err);
    }
  }

  // helper to decode token expiry (returns ms epoch or null)
  private extractExpiryFromToken(token: string | null): number | null {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload && payload.exp) {
        return payload.exp * 1000;
      }
    } catch (e) {
      // ignore
    }
    return null;
  }

  // Event handler: NextAuth (or your refresh code) can dispatch window.dispatchEvent(new Event('auth:refresh'))
  private handleAuthRefreshEvent = async () => {
    try {
      const session = await getSession();
      if (session?.accessToken) {
        this.accessToken = session.accessToken;
        this.refreshToken = session.refreshToken ?? this.refreshToken;
        this.accessTokenExpires = this.extractExpiryFromToken(this.accessToken) || Date.now() + 55 * 60 * 1000;
      }
    } catch (e) {
      console.warn('auth:refresh handler failed to update tokens', e);
    }
  };

  // synchronous-ish getter (fast, does NOT call getSession)
  public getAccessTokenSync(): string | null {
    return this.accessToken;
  }

  public async getAccessToken(): Promise<string | null> {
    // fast path: return in-memory value
    if (this.accessToken) return this.accessToken;
    // fallback: try reading session once (rare path)
    try {
      const session = await getSession();
      this.accessToken = session?.accessToken ?? null;
      this.refreshToken = session?.refreshToken ?? this.refreshToken;
      this.accessTokenExpires = this.extractExpiryFromToken(this.accessToken) || this.accessTokenExpires;
      return this.accessToken;
    } catch (e) {
      return null;
    }
  }

  private isExpired(): boolean {
    if (!this.accessToken) return true;
    // consider token expired if within 60s of expiry
    const now = Date.now();
    return this.accessTokenExpires - now < 60 * 1000;
  }

  // main entry for ApiClient interceptor
  public async getValidAccessToken(): Promise<string | null> {
    const startTime = performance.now();
    
    if (!this.isExpired()) {
      const duration = performance.now() - startTime;
      if (duration > 10) { // Log if it takes more than 10ms
        console.log(`TokenManager: getValidAccessToken took ${duration.toFixed(2)}ms (cached)`);
      }
      return this.accessToken;
    }
    
    // if already refreshing, wait
    if (this.isRefreshing) {
      console.log('TokenManager: Token expired, waiting for refresh...');
      return new Promise((resolve, reject) => {
        this.waiting.push({ resolve, reject });
      }).then(() => this.accessToken);
    }

    // otherwise start refresh flow
    console.log('TokenManager: Token expired, starting refresh...');
    const ok = await this.refreshAccessToken();
    if (!ok) {
      // handle auth failure (logout)
      await this.handleAuthFailure();
      return null;
    }
    
    const duration = performance.now() - startTime;
    console.log(`TokenManager: getValidAccessToken took ${duration.toFixed(2)}ms (refreshed)`);
    return this.accessToken;
  }

  // robust refresh: only one refresh at a time, queue others
  public async refreshAccessToken(): Promise<boolean> {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.waiting.push({ resolve, reject });
      }).then(() => true).catch(() => false);
    }

    this.isRefreshing = true;
    try {
      const refreshToken = this.refreshToken ?? (await this.getRefreshTokenFromSession());
      if (!refreshToken) throw new Error('No refresh token');

      const issuer = process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER || 'http://localhost:9090/realms/AeB_Dms';
      const clientId = process.env.NEXT_PUBLIC_KEYCLOAK_ID || 'dms-backend-app';
      const clientSecret = process.env.KEYCLOAK_SECRET || 'fbOTgjSIZPHi1Cl6tQ2pFGPFa9fPr6Zi';

      const res = await fetch(`${issuer}/protocol/openid-connect/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
        }),
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        throw new Error(`Refresh failed: ${res.status} ${errBody}`);
      }

      const tokens: TokenRefreshResponse = await res.json();
      // update memory
      this.accessToken = tokens.access_token;
      this.refreshToken = tokens.refresh_token ?? this.refreshToken;
      this.accessTokenExpires = Date.now() + tokens.expires_in * 1000;

      // Notify NextAuth/session consumers that tokens changed (optional)
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('auth:refresh'));
      }

      // resolve waiting queue
      this.processQueue(null);
      return true;
    } catch (err) {
      console.error('TokenManager.refreshAccessToken error', err);
      this.processQueue(err);
      return false;
    } finally {
      this.isRefreshing = false;
    }
  }

  private processQueue(error: any | null) {
    this.waiting.forEach(({ resolve, reject }) => {
      if (error) reject(error);
      else resolve(null);
    });
    this.waiting = [];
  }

  private async getRefreshTokenFromSession(): Promise<string | null> {
    try {
      const s = await getSession();
      return (s as any)?.refreshToken ?? null;
    } catch {
      return null;
    }
  }

  public async handleAuthFailure(): Promise<void> {
    try {
      // signOut from NextAuth (non-blocking)
      await signOut({ redirect: false, callbackUrl: '/auth/signin' });
    } catch (err) {
      console.warn('signOut failed', err);
    } finally {
      if (typeof window !== 'undefined') {
        window.location.href = '/auth/signin';
      }
    }
  }
}

// Export singleton instance
export const tokenManager = TokenManager.getInstance();
