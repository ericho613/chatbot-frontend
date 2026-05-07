import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ChatMessage } from '../models/chatbot.models';

@Injectable({ providedIn: 'root' })
export class ChatStateService {
  private readonly _messages = new BehaviorSubject<ChatMessage[]>([]);
  readonly messages$ = this._messages.asObservable();

  private readonly _streamingEnabled = new BehaviorSubject<boolean>(true);
  readonly streamingEnabled$ = this._streamingEnabled.asObservable();

  get messages(): ChatMessage[] {
    return this._messages.value;
  }

  get streamingEnabled(): boolean {
    return this._streamingEnabled.value;
  }

  setStreamingEnabled(value: boolean): void {
    this._streamingEnabled.next(value);
  }

  addMessage(
    role: 'user' | 'assistant' | 'system',
    content: string,
    pending = false,
    extras: Partial<ChatMessage> = {}
  ): ChatMessage {
    const message: ChatMessage = {
      id: this.generateId(),
      role,
      content,
      timestamp: Date.now(),
      pending,
      ...extras
    };

    this._messages.next([...this._messages.value, message]);
    return message;
  }

  updateMessage(id: string, patch: Partial<ChatMessage>): void {
    const next = this._messages.value.map(m => m.id === id ? { ...m, ...patch } : m);
    this._messages.next(next);
  }

  clear(): void {
    this._messages.next([]);
  }

  toBackendMessages(): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    return this._messages.value
      .filter(m => m.role === 'user' || m.role === 'assistant' || m.role === 'system')
      .map(m => ({ role: m.role, content: m.content }));
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}