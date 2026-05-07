import { Component, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ApiService } from '../../services/api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { NotificationService } from '../../services/notification.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-rag-query-dialog',
  templateUrl: './rag-query-dialog.component.html',
  standalone: false
})
export class RagQueryDialogComponent {
  query = '';
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private api: ApiService,
    private chatState: ChatStateService,
    private notifications: NotificationService,
    private changeDetector: ChangeDetectorRef,
    public languageService: LanguageService
  ) {}

  async submit(): Promise<void> {
    if (!this.query.trim() || this.loading) return;

    this.loading = true;
    this.changeDetector.detectChanges();

    const assistantMessage = this.chatState.addMessage('assistant', '', true);

    try {

      const result = await this.api.ragQuery(
        {
          query: this.query.trim(),
          stream: this.chatState.streamingEnabled,
          top_k: 5,
          generation_config: {
            max_tokens: 1000,
            temperature: 0.4,
            top_p: 1.0
          }
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
      //   content: 'Sorry, an error occurred while processing the RAG query.',
      //   pending: false
      // });
      // this.notifications.error('RAG query failed', error?.message || 'Unable to process RAG query.');

      this.chatState.updateMessage(assistantMessage.id, {
        content: this.languageService.t('error.rag'),
        pending: false
      });
      this.notifications.error(
        this.languageService.t('notification.ragFailedTitle'),
        error?.message || this.languageService.t('notification.ragFailedBody')
      );
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }
}