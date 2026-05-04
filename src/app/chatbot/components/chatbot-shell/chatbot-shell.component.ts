import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ChatStateService } from '../../services/chat-state.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { ChatMessage, GenerationConfig } from '../../models/chatbot.models';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef, inject } from '@angular/core';

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
    private changeDetector: ChangeDetectorRef
  ) {}

  // ngOnInit(): void {
    

  //   this.chatState.streamingEnabled$
  //     .pipe(takeUntilDestroyed(this.destroyRef))
  //     .subscribe(enabled => this.streamingEnabled = enabled);
  // }

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

    // this.chatState.messages$.subscribe(messages => {
    //   this.messages = messages;
    //   if (!messages.length) {
    //     this.ensureDefaultGreeting();
    //   }
    // });

    this.chatState.streamingEnabled$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(enabled => this.streamingEnabled = enabled);

    // this.chatState.streamingEnabled$.subscribe(enabled => this.streamingEnabled = enabled);
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
        content: 'Sorry, an error occurred while processing your request.',
        pending: false
      });
      this.notifications.error('Chat request failed', error?.message || 'Unable to contact the server.');
    }
  }

  clearChat(): void {
    this.chatState.clear();
    this.ensureDefaultGreeting();
    this.notifications.info('Chat cleared', 'The chat history has been removed.');
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
        this.notifications.error('Copy failed', 'Clipboard is not available in this environment.');
        return;
      }
      await navigator.clipboard.writeText(markdown);
      this.notifications.success('Chat copied', 'The chat history was copied to the clipboard in markdown format.');
    } catch {
      this.notifications.error('Copy failed', 'Unable to copy the chat history to the clipboard.');
    }
  }

  openMobileSidebar(): void {
    this.mobileSidebarOpen = true;
  }

  closeMobileSidebar(): void {
    this.mobileSidebarOpen = false;
  }

  private getMessageById(id: string): ChatMessage | undefined {
    return this.chatState.messages.find(m => m.id === id);
  }

  private ensureDefaultGreeting(): void {
    if (!this.chatState.messages.length) {
      this.chatState.addMessage('assistant', 'Hello. How can I help you today?');
    }
  }

  private isOnlyDefaultGreetingPresent(): boolean {
    return this.chatState.messages.length === 1
      && this.chatState.messages[0].role === 'assistant'
      && this.chatState.messages[0].content === 'Hello. How can I help you today?';
  }
}