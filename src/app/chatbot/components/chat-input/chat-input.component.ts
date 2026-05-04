import { AfterViewInit, Component, ElementRef, EventEmitter, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-chat-input',
  templateUrl: './chat-input.component.html',
  styleUrls: ['./chat-input.component.scss'],
  standalone: false
})
export class ChatInputComponent implements AfterViewInit {
  @Output() sendMessage = new EventEmitter<string>();
  @ViewChild('textarea') textarea!: ElementRef<HTMLTextAreaElement>;

  text = '';
  sending = false;
  private readonly maxHeightPx = 220;

  ngAfterViewInit(): void {
    this.resizeTextarea();
  }

  submit(): void {
    const value = this.text.trim();
    if (!value || this.sending) return;

    this.sendMessage.emit(value);
    this.text = '';
    setTimeout(() => this.resizeTextarea());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }

  onInput(): void {
    this.resizeTextarea();
  }

  private resizeTextarea(): void {
    if (!this.textarea) return;

    const el = this.textarea.nativeElement;
    el.style.height = 'auto';

    const nextHeight = Math.min(el.scrollHeight, this.maxHeightPx);
    el.style.height = `${nextHeight}px`;
    el.style.overflowY = el.scrollHeight > this.maxHeightPx ? 'auto' : 'hidden';
  }
}