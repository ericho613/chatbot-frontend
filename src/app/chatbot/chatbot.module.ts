import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';

import { NgbModalModule, NgbToastModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';

import { ChatbotRoutingModule } from './chatbot-routing.module';

import { ChatbotShellComponent } from './components/chatbot-shell/chatbot-shell.component';
import { FeatureSidebarComponent } from './components/feature-sidebar/feature-sidebar.component';
import { ChatHistoryComponent } from './components/chat-history/chat-history.component';
import { ChatInputComponent } from './components/chat-input/chat-input.component';
import { RagQueryDialogComponent } from './components/dialogs/rag-query-dialog.component';
import { PdfSummaryDialogComponent } from './components/dialogs/pdf-summary-dialog.component';
import { PdfCitationDialogComponent } from './components/dialogs/pdf-citation-dialog.component';
import { PdfUploadDialogComponent } from './components/dialogs/pdf-upload-dialog.component';
import { JwtGeneratorDialogComponent } from './components/dialogs/jwt-generator-dialog.component';
import { FileDropzoneComponent } from './components/dialogs/file-dropzone.component';
import { ToastHostComponent } from './components/toast-host/toast-host.component';
import { SettingsDialogComponent } from './components/dialogs/settings-dialog.component';
import { TranslatePipe } from './pipes/translate.pipe';

@NgModule({
  declarations: [
    ChatbotShellComponent,
    FeatureSidebarComponent,
    ChatHistoryComponent,
    ChatInputComponent,
    RagQueryDialogComponent,
    PdfSummaryDialogComponent,
    PdfCitationDialogComponent,
    PdfUploadDialogComponent,
    JwtGeneratorDialogComponent,
    FileDropzoneComponent,
    ToastHostComponent,
    SettingsDialogComponent,
    TranslatePipe
  ],
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgbModalModule,
    NgbToastModule,
    NgbTooltipModule,
    ChatbotRoutingModule
  ],
  exports: [ChatbotShellComponent]
})
export class ChatbotModule {}