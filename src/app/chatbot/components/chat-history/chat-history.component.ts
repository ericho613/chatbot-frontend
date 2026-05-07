import { AfterViewChecked, Component, ElementRef, Input, ViewChild } from '@angular/core';
import { ChatMessage } from '../../models/chatbot.models';
import { MarkdownService } from '../../services/markdown.service';
import { SafeHtml } from '@angular/platform-browser';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-chat-history',
  templateUrl: './chat-history.component.html',
  styleUrls: ['./chat-history.component.scss'],
  standalone: false
})
export class ChatHistoryComponent implements AfterViewChecked {
  @Input() messages: ChatMessage[] = [];
  @Input() clearRequested!: () => void;
  @Input() copyRequested!: () => void;
  
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef<HTMLDivElement>;

  hovered = false;

  private isNearBottom = true;
  private lastMessagesCount = 0;

  constructor(
    private markdown: MarkdownService,
    public languageService: LanguageService
  ) {}

  onScroll(): void {
    const element = this.scrollContainer.nativeElement;
    const threshold = 20;
    // Check if user is currently near the bottom
    this.isNearBottom = (element.scrollHeight - element.scrollTop - element.clientHeight) < threshold;
    // this.lastMessagesCount = this.messages.length;
  }

  ngAfterViewChecked(): void {

    // Only scroll to bottom if the user was already there and if a message was added or
    // the last message has a pending status due to streaming
    if (
      this.isNearBottom 
      && 
        (
          (this.messages.length > this.lastMessagesCount) 
          || (this.messages[this.messages.length -1] && this.messages[this.messages.length -1].pending)
        )
    ) {
      this.scrollToBottom();
    }
    this.lastMessagesCount = this.messages.length;
  }

  renderMarkdown(content: string): SafeHtml {
    return this.markdown.render(content);
  }

  private scrollToBottom(): void {
    if (!this.scrollContainer) return;

    // Use setTimeout to wait for the DOM to update with the new item
    setTimeout(() => {
      const element = this.scrollContainer.nativeElement;
      element.scrollTop = element.scrollHeight;
    }, 0);

  }

  trackById(_: number, item: ChatMessage): string {
    return item.id;
  }
}