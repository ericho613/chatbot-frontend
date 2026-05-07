import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { LanguageService } from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;

  beforeEach(() => {
    document.cookie = 'chatbotLanguage=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('should load english translations during initialize', async () => {
    await TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LanguageService);
    await service.initialize();

    expect(service.t('header.tools')).toBe('Tools');
    expect(service.t('chat.defaultGreeting')).toBe('Hello. How can I help you today?');
  });

  it('should switch to french after setLanguage', async () => {
    await TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LanguageService);
    await service.initialize();
    await service.setLanguage('fr');

    expect(service.currentLanguage).toBe('fr');
    expect(service.t('header.tools')).toBe('Outils');
  });

  it('should fall back to english when a key is missing in current language', async () => {
    await TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LanguageService);
    await service.initialize();

    expect(service.t('missing.key')).toBe('missing.key');
  });

  it('should default to english when cookie is not set', async () => {
    await TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LanguageService);
    await service.initialize();

    expect(service.currentLanguage).toBe('en');
  });

  it('should initialize current language from cookie', async () => {
    document.cookie = 'chatbotLanguage=fr; path=/';

    await TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LanguageService);
    await service.initialize();

    expect(service.currentLanguage).toBe('fr');
    expect(service.t('header.tools')).toBe('Outils');
  });
});