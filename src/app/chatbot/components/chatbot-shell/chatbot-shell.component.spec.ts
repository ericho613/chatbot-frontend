import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { of } from 'rxjs';

import { ChatbotShellComponent } from './chatbot-shell.component';
import { ChatStateService } from '../../services/chat-state.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AuthTokenService } from '../../services/auth-token.service';
import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Pipe({ name: 't' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

@Component({
  selector: 'app-feature-sidebar',
  template: ''
})
class MockFeatureSidebarComponent {
  @Input() mobileMode = false;
}

@Component({
  selector: 'app-chat-history',
  template: ''
})
class MockChatHistoryComponent {
  @Input() messages: any[] = [];
  @Input() clearRequested!: () => void;
  @Input() copyRequested!: () => void;
}

@Component({
  selector: 'app-chat-input',
  template: ''
})
class MockChatInputComponent {
  // @Input() disabled = false;
  @Output() sendMessage = new EventEmitter<string>();
}

@Component({
  selector: 'app-toast-host',
  template: ''
})
class MockToastHostComponent {}

describe('ChatbotShellComponent', () => {
  let component: ChatbotShellComponent;
  let fixture: ComponentFixture<ChatbotShellComponent>;
  let chatStateSpy: jasmine.SpyObj<ChatStateService>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let authSpy: jasmine.SpyObj<AuthTokenService>;

  beforeEach(async () => {
    chatStateSpy = jasmine.createSpyObj(
      'ChatStateService',
      ['addMessage', 'updateMessage', 'clear', 'toBackendMessages', 'setStreamingEnabled'],
      {
        messages$: of([]),
        messages: [],
        streamingEnabled$: of(true)
      }
    );

    apiSpy = jasmine.createSpyObj('ApiService', ['basicChat']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['error', 'info', 'success']);
    authSpy = jasmine.createSpyObj('AuthTokenService', ['refreshTokenIfPossible']);

    chatStateSpy.toBackendMessages.and.returnValue([{ role: 'user', content: 'Hello' }]);
    chatStateSpy.addMessage.and.callFake((role: any, content: any, pending?: any, extras?: any) => ({
      id: `${role}-${content || 'empty'}-${pending ? 'pending' : 'final'}`,
      role,
      content,
      timestamp: Date.now(),
      pending,
      ...(extras || {})
    }));

    authSpy.refreshTokenIfPossible.and.resolveTo(null);

    await TestBed.configureTestingModule({
      declarations: [
        ChatbotShellComponent,
        MockFeatureSidebarComponent,
        MockChatHistoryComponent,
        MockChatInputComponent,
        MockToastHostComponent,
        MockTranslatePipe
      ],
      providers: [
        { provide: ChatStateService, useValue: chatStateSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthTokenService, useValue: authSpy },
        LanguageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotShellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    chatStateSpy.addMessage.calls.reset();
    chatStateSpy.updateMessage.calls.reset();
    notificationSpy.error.calls.reset();
    notificationSpy.info.calls.reset();
  });

  it('should create and refresh token on init', () => {
    expect(component).toBeTruthy();
    expect(authSpy.refreshTokenIfPossible).toHaveBeenCalled();
  });

  it('should send a message and update assistant response on success', async () => {
    apiSpy.basicChat.and.resolveTo('Assistant reply');

    await component.onSendMessage('Hello');

    expect(chatStateSpy.addMessage).toHaveBeenCalledWith('user', 'Hello');
    expect(apiSpy.basicChat).toHaveBeenCalled();
    expect(chatStateSpy.updateMessage).toHaveBeenCalled();
  });

  it('should handle chat failure', async () => {
    apiSpy.basicChat.and.rejectWith(new Error('Chat failed'));

    await component.onSendMessage('Hello');

    expect(notificationSpy.error).toHaveBeenCalledWith(
      component.languageService.t('notification.chatRequestFailedTitle'),
      'Chat failed'
    );

    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith(jasmine.any(String), {
      content: component.languageService.t('error.chatProcessing'),
      pending: false
    });
  });

  it('should clear chat and notify', () => {
    component.clearChat();

    expect(chatStateSpy.clear).toHaveBeenCalled();
    expect(notificationSpy.info).toHaveBeenCalledWith(
      component.languageService.t('notification.chatClearedTitle'),
      component.languageService.t('notification.chatClearedBody')
    );
  });

  it('should open mobile sidebar', () => {
    component.openMobileSidebar();
    expect(component.mobileSidebarOpen).toBeTrue();
  });

  it('should close mobile sidebar', () => {
    component.mobileSidebarOpen = true;
    component.closeMobileSidebar();
    expect(component.mobileSidebarOpen).toBeFalse();
  });

  it('should add a default greeting flagged as default when chat is empty', () => {
    chatStateSpy.messages.splice(0, chatStateSpy.messages.length);
    component['ensureDefaultGreeting']();

    expect(chatStateSpy.addMessage).toHaveBeenCalledWith(
      'assistant',
      component.languageService.t('chat.defaultGreeting'),
      false,
      { isDefaultGreeting: true }
    );
  });

  it('should detect only default greeting by flag instead of content', () => {
    chatStateSpy.messages.splice(0, chatStateSpy.messages.length);
    chatStateSpy.messages.push({
        id: 'greeting-1',
        role: 'assistant',
        content: 'Anything at all',
        timestamp: Date.now(),
        isDefaultGreeting: true
      });

    expect(component['isOnlyDefaultGreetingPresent']()).toBeTrue();
  });

  it('should refresh flagged default greeting when language changes', async () => {
    chatStateSpy.messages.splice(0, chatStateSpy.messages.length);
    chatStateSpy.messages.push({
        id: 'greeting-1',
        role: 'assistant',
        content: 'Hello. How can I help you today?',
        timestamp: Date.now(),
        isDefaultGreeting: true
      });

    spyOn(component.languageService, 'setLanguage').and.resolveTo();

    component.setLanguage('fr');
    await Promise.resolve();

    expect(component.languageService.setLanguage).toHaveBeenCalledWith('fr');
    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith('greeting-1', {
      content: component.languageService.t('chat.defaultGreeting'),
      isDefaultGreeting: true
    });
  });
});