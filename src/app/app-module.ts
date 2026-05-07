import { APP_INITIALIZER, NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { App } from './app';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { LanguageService } from './chatbot/services/language.service';

export function initializeLanguage(languageService: LanguageService): () => Promise<void> {
  return () => languageService.initialize();
}

@NgModule({
  declarations: [App],
  imports: [BrowserModule, AppRoutingModule, FontAwesomeModule],
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    {
      provide: APP_INITIALIZER,
      useFactory: initializeLanguage,
      deps: [LanguageService],
      multi: true
    }
  ],
  bootstrap: [App],
})
export class AppModule {}