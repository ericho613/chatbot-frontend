import { Component, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectedFileItem } from '../../models/chatbot.models';
import { ApiService } from '../../services/api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-pdf-summary-dialog',
  templateUrl: './pdf-summary-dialog.component.html',
  standalone: false
})
export class PdfSummaryDialogComponent {
  language: 'English' | 'French' = 'English';
  selectedFiles: SelectedFileItem[] = [];
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private api: ApiService,
    private chatState: ChatStateService,
    private notifications: NotificationService,
    private changeDetector: ChangeDetectorRef,
    public languageService: LanguageService
  ) {}

  onFilesSelected(files: File[]): void {
    const first = files[0];
    if (!first) return;

    this.selectedFiles = [{
      file: first,
      name: first.name,
      size: first.size
    }];
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles];
  }

  async submit(): Promise<void> {
    if (!this.selectedFiles.length || this.loading) return;

    this.loading = true;
    this.changeDetector.detectChanges();

    const assistantMessage = this.chatState.addMessage('assistant', '', true);

    try {

      const result = await this.api.summarizePdf(
        this.selectedFiles[0].file,
        this.chatState.streamingEnabled,
        this.language,
        {
          max_tokens: 1000,
          temperature: 0.5,
          top_p: 1.0
        },
        (chunk) => {
          const existing = this.chatState.messages.find(m => m.id === assistantMessage.id)?.content || '';
          this.chatState.updateMessage(assistantMessage.id, {
            content: existing + chunk,
            pending: true
          });
        }
      );

      this.chatState.updateMessage(assistantMessage.id, {
        content: result,
        pending: false
      });

      this.activeModal.close();
    } catch (error: any) {
      // this.chatState.updateMessage(assistantMessage.id, {
      //   content: 'Sorry, an error occurred while generating the summary.',
      //   pending: false
      // });
      // this.notifications.error('Summary generation failed', error?.message || 'Unable to summarize the PDF.');

      this.chatState.updateMessage(assistantMessage.id, {
        content: this.languageService.t('error.summary'),
        pending: false
      });
      this.notifications.error(
        this.languageService.t('notification.summaryFailedTitle'),
        error?.message || this.languageService.t('notification.summaryFailedBody')
      );
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }
}