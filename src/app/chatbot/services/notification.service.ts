import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ToastMessage } from '../models/chatbot.models';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly _toasts = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this._toasts.asObservable();

  show(toast: ToastMessage): void {
    const current = this._toasts.value;
    this._toasts.next([...current, toast]);
  }

  success(title: string, body: string): void {
    this.show({
      id: this.generateId(),
      type: 'success',
      title,
      body,
      delay: 4000
    });
  }

  error(title: string, body: string): void {
    this.show({
      id: this.generateId(),
      type: 'danger',
      title,
      body,
      delay: 6000
    });
  }

  info(title: string, body: string): void {
    this.show({
      id: this.generateId(),
      type: 'info',
      title,
      body,
      delay: 4000
    });
  }

  remove(id: string): void {
    this._toasts.next(this._toasts.value.filter(t => t.id !== id));
  }

  private generateId(): string {
    return typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}