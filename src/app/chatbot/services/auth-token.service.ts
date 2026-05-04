import { Injectable, OnDestroy } from '@angular/core';

/**
 * Handles JWT generation, cookie persistence, and automatic refresh.
 *
 * This service creates a HS256 JWT in the browser using the Web Crypto API.
 * The frontend-generated JWT only works if the provided secret matches the
 * backend JWT secret.
 */
@Injectable({ providedIn: 'root' })
export class AuthTokenService implements OnDestroy {
  private readonly cookieKey = 'chatbotAccessToken';
  private readonly secretStorageKey = 'chatbotJwtSecret';
  private readonly refreshIntervalMs = 25 * 60 * 1000; // 25 minutes
  private readonly expireMinutes = 30;
  private refreshTimerId: number | null = null;

  constructor() {
    // Start automatic refresh when service is created.
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.refreshTimerId) {
      if(typeof window !== 'undefined') {
        window.clearInterval(this.refreshTimerId);
      }
    }
  }

  getToken(): string | null {
    if(typeof document !== 'undefined') {
      const cookies = document.cookie.split(';').map(v => v.trim());
      const target = cookies.find(c => c.startsWith(`${this.cookieKey}=`));
      if (!target) return null;
      return decodeURIComponent(target.split('=').slice(1).join('='));
    }
    return null;
  }

  getStoredSecret(): string | null {
    if(typeof localStorage !== 'undefined') {
      return localStorage.getItem(this.secretStorageKey);
    }
    return null;
  }

  async generateAndStoreToken(secret: string): Promise<string> {
    // Persist the secret for scheduled regeneration every 25 minutes.

    if(typeof localStorage !== 'undefined') {
      localStorage.setItem(this.secretStorageKey, secret);
    }

    const token = await this.createHs256Jwt(secret);
    this.setCookie(this.cookieKey, token, this.expireMinutes);
    return token;
  }

  async refreshTokenIfPossible(): Promise<string | null> {
    const secret = this.getStoredSecret();
    if (!secret) return null;
    return this.generateAndStoreToken(secret);
  }

  clearToken(): void {
    if(typeof document !== 'undefined') {
      document.cookie = `${this.cookieKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
  }

  private startAutoRefresh(): void {
    if(typeof window !== 'undefined') {
      this.refreshTimerId = window.setInterval(async () => {
        try {
          await this.refreshTokenIfPossible();
        } catch {
          // Fail silently here; requests will still fail visibly if token becomes invalid.
        }
      }, this.refreshIntervalMs);
    }
  }

  private setCookie(name: string, value: string, expireMinutes: number): void {
    if(typeof document !== 'undefined') {
      const expires = new Date(Date.now() + expireMinutes * 60 * 1000).toUTCString();
      document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}; SameSite=Lax`;
    }
  }

  /**
   * Creates a JWT using browser crypto:
   * header.payload.signature
   */
  private async createHs256Jwt(secret: string): Promise<string> {
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      sub: 'frontend-user',
      iat: now,
      exp: now + (this.expireMinutes * 60)
    };

    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = this.base64UrlEncode(JSON.stringify(header));
    const encodedPayload = this.base64UrlEncode(JSON.stringify(payload));
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.signHmacSha256(unsignedToken, secret);

    return `${unsignedToken}.${signature}`;
  }

  private async signHmacSha256(data: string, secret: string): Promise<string> {
    const enc = new TextEncoder();
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );

    const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(data));
    return this.arrayBufferToBase64Url(signatureBuffer);
  }

  private base64UrlEncode(input: string): string {
    const bytes = new TextEncoder().encode(input);
    return this.arrayBufferToBase64Url(bytes.buffer);
  }

  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(byte => binary += String.fromCharCode(byte));
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }
}