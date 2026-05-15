import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

/**
 * Root routes for the Angular application.
 * Redirect root path to the chatbot feature.
 */
const routes: Routes = [
  // {
  //   path: '',
  //   pathMatch: 'full',
  //   redirectTo: 'chatbot'
  // },
  {
    path: '',
    pathMatch: 'full',
    // path: 'chatbot',
    loadChildren: () =>
      import('./chatbot/chatbot.module').then(m => m.ChatbotModule)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    scrollPositionRestoration: 'enabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule {}