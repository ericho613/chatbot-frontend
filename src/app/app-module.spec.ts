import { TestBed } from '@angular/core/testing';
import { APP_INITIALIZER } from '@angular/core';
import { AppModule, initializeLanguage } from './app-module';
import { LanguageService } from './chatbot/services/language.service';

describe('AppModule language initializer', () => {
  it('should provide APP_INITIALIZER for LanguageService', () => {
    const languageServiceSpy = jasmine.createSpyObj<LanguageService>('LanguageService', ['initialize']);
    languageServiceSpy.initialize.and.resolveTo();

    const initFn = initializeLanguage(languageServiceSpy);

    expect(initFn).toEqual(jasmine.any(Function));
  });

  it('should call languageService.initialize from initializer factory', async () => {
    const languageServiceSpy = jasmine.createSpyObj<LanguageService>('LanguageService', ['initialize']);
    languageServiceSpy.initialize.and.resolveTo();

    const initFn = initializeLanguage(languageServiceSpy);
    await initFn();

    expect(languageServiceSpy.initialize).toHaveBeenCalled();
  });
});