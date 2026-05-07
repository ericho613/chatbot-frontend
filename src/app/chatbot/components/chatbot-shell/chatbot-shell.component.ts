import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ChatStateService } from '../../services/chat-state.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { ChatMessage, GenerationConfig } from '../../models/chatbot.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';
import { LanguageService, AppLanguage } from '../../services/language.service';

@Component({
  selector: 'app-chatbot-shell',
  templateUrl: './chatbot-shell.component.html',
  styleUrls: ['./chatbot-shell.component.scss'],
  standalone: false
})
export class ChatbotShellComponent implements OnInit {
  messages: ChatMessage[] = [];
  streamingEnabled = true;
  mobileSidebarOpen = false;

  private readonly defaultGenerationConfig: GenerationConfig = {
    max_tokens: 1000,
    temperature: 0.7,
    top_p: 1.0
  };

  private destroyRef = inject(DestroyRef);

  constructor(
    private chatState: ChatStateService,
    private api: ApiService,
    private notifications: NotificationService,
    private authTokenService: AuthTokenService,
    private changeDetector: ChangeDetectorRef,
    public languageService: LanguageService
  ) {}

  ngOnInit(): void {
    this.chatState.messages$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(messages => {
        this.messages = messages;
        this.changeDetector.detectChanges();

        if (!messages.length) {
          this.ensureDefaultGreeting();
        }
      });

    this.chatState.streamingEnabled$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(enabled => this.streamingEnabled = enabled);

    this.authTokenService.refreshTokenIfPossible().catch(() => undefined);

    if (!this.chatState.messages.length) {
      this.ensureDefaultGreeting();
    }
  }

  async onSendMessage(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed) return;

    if (this.isOnlyDefaultGreetingPresent()) {
      this.chatState.clear();
    }

    this.chatState.addMessage('user', trimmed);
    const assistantMessage = this.chatState.addMessage('assistant', '', true);

    try {
      const result = await this.api.basicChat(
        {
          messages: this.chatState.toBackendMessages(),
          stream: this.chatState.streamingEnabled,
          generation_config: this.defaultGenerationConfig
        },
        (chunk) => {
          const existing = this.getMessageById(assistantMessage.id)?.content || '';
          this.chatState.updateMessage(assistantMessage.id, {
            content: existing + chunk,
            pending: true
          });
        }
      );

      if (!this.chatState.streamingEnabled) {
        this.chatState.updateMessage(assistantMessage.id, {
          content: result,
          pending: false
        });
      } else {
        this.chatState.updateMessage(assistantMessage.id, {
          content: this.getMessageById(assistantMessage.id)?.content || result,
          pending: false
        });
      }
    } catch (error: any) {
      this.chatState.updateMessage(assistantMessage.id, {
        content: this.languageService.t('error.chatProcessing'),
        pending: false
      });
      this.notifications.error(
        this.languageService.t('notification.chatRequestFailedTitle'),
        error?.message || this.languageService.t('notification.chatRequestFailedBody')
      );
    }
  }

  clearChat(): void {
    this.chatState.clear();
    this.ensureDefaultGreeting();
    this.notifications.info(
      this.languageService.t('notification.chatClearedTitle'),
      this.languageService.t('notification.chatClearedBody')
    );
  }

  setStreaming(value: boolean): void {
    this.chatState.setStreamingEnabled(value);
  }

  async copyChatHistory(): Promise<void> {
    const markdown = this.messages
      .map(message => {
        const heading = message.role === 'user' ? '## User' : '## Assistant';
        return `${heading}\n\n${message.content}`;
      })
      .join('\n\n---\n\n');

    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard) {
        this.notifications.error(
          this.languageService.t('notification.copyFailedTitle'),
          this.languageService.t('notification.copyFailedClipboardUnavailable')
        );
        return;
      }

      await navigator.clipboard.writeText(markdown);
      this.notifications.success(
        this.languageService.t('notification.chatCopiedTitle'),
        this.languageService.t('notification.chatCopiedBody')
      );
    } catch {
      this.notifications.error(
        this.languageService.t('notification.copyFailedTitle'),
        this.languageService.t('notification.copyFailedBody')
      );
    }
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen = true;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  setLanguage(language: string): void {
    if (language === 'fr' || language === 'en') {
      this.languageService.setLanguage(language as AppLanguage).then(() => {
        this.refreshDefaultGreetingIfNeeded();
      });
    }
  }

  private getMessageById(id: string): ChatMessage | undefined {
    return this.chatState.messages.find(m => m.id === id);
  }

  private ensureDefaultGreeting(): void {
    if (!this.chatState.messages.length) {
      this.chatState.addMessage(
        'assistant',
        this.languageService.t('chat.defaultGreeting'),
        false,
        { isDefaultGreeting: true }
      );
    }
  }

  private isOnlyDefaultGreetingPresent(): boolean {
    return this.chatState.messages.length === 1
      && this.chatState.messages[0].role === 'assistant'
      && this.chatState.messages[0].isDefaultGreeting === true;
  }

  private refreshDefaultGreetingIfNeeded(): void {
    if (!this.chatState.messages.length) {
      this.ensureDefaultGreeting();
      return;
    }

    if (this.isOnlyDefaultGreetingPresent()) {
      const greetingMessage = this.chatState.messages[0];
      this.chatState.updateMessage(greetingMessage.id, {
        content: this.languageService.t('chat.defaultGreeting'),
        isDefaultGreeting: true
      });
    }
  }
}