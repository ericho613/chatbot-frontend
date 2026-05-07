import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import enTranslations from '../../../assets/i18n/en.json';
import frTranslations from '../../../assets/i18n/fr.json';

export type AppLanguage = 'en' | 'fr';

type TranslationMap = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly cookieKey = 'chatbotLanguage';
  private readonly defaultLanguage: AppLanguage = 'en';

  private readonly isBrowser: boolean;

  private translations: Record<AppLanguage, TranslationMap> = {
    en: {},
    fr: {}
  };

  private readonly _language = new BehaviorSubject<AppLanguage>(this.defaultLanguage);
  readonly language$ = this._language.asObservable();

  private loadPromise: Promise<void> | null = null;

  get currentLanguage(): AppLanguage {
    return this._language.value;
  }

  constructor(@Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);

    const cookieLanguage = this.readLanguageFromCookie();
    this._language.next(cookieLanguage);

    if (this.isBrowser) {
      this.writeLanguageCookie(cookieLanguage);
    }
  }

  async initialize(): Promise<void> {
    await this.ensureTranslationsLoaded();
  }

  async setLanguage(language: AppLanguage): Promise<void> {
    if (language !== 'en' && language !== 'fr') return;

    await this.ensureTranslationsLoaded();
    this._language.next(language);

    if (this.isBrowser) {
      this.writeLanguageCookie(language);
    }
  }

  t(key: string): string {
    return this.translations[this.currentLanguage]?.[key]
      || this.translations.en?.[key]
      || key;
  }

  async ensureTranslationsLoaded(): Promise<void> {
    if (!this.loadPromise) {
      this.loadPromise = this.loadTranslations();
    }

    await this.loadPromise;
  }

  private async loadTranslations(): Promise<void> {
    this.translations.en = (enTranslations as TranslationMap) || {};
    this.translations.fr = (frTranslations as TranslationMap) || {};

    this._language.next(this._language.value);
  }

  private readLanguageFromCookie(): AppLanguage {
    if (typeof document === 'undefined') {
      return this.defaultLanguage;
    }

    const cookies = document.cookie.split(';').map(v => v.trim());
    const target = cookies.find(c => c.startsWith(`${this.cookieKey}=`));
    if (!target) return this.defaultLanguage;

    const value = decodeURIComponent(target.split('=').slice(1).join('='));
    return value === 'fr' ? 'fr' : 'en';
  }

  private writeLanguageCookie(language: AppLanguage): void {
    if (typeof document === 'undefined') return;

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${this.cookieKey}=${encodeURIComponent(language)}; path=/; expires=${expires}; SameSite=Lax`;
  }
}