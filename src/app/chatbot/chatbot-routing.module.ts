import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ChatbotShellComponent } from './components/chatbot-shell/chatbot-shell.component';

/**
 * Feature routes for the chatbot module.
 * The chatbot shell is the main page for this feature.
 */
const routes: Routes = [
  {
    path: '',
    component: ChatbotShellComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ChatbotRoutingModule {}