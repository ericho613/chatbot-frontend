import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { of } from 'rxjs';

import { ChatbotShellComponent } from './chatbot-shell.component';
import { ChatStateService } from '../../services/chat-state.service';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AuthTokenService } from '../../services/auth-token.service';

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
      ['addMessage', 'updateMessage', 'clear', 'toBackendMessages'],
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
    chatStateSpy.addMessage.and.callFake((role: any, content: any, pending?: any) => ({
      id: `${role}-${content || 'empty'}-${pending ? 'pending' : 'final'}`,
      role,
      content,
      timestamp: Date.now(),
      pending
    }));

    authSpy.refreshTokenIfPossible.and.resolveTo(null);

    await TestBed.configureTestingModule({
      declarations: [
        ChatbotShellComponent,
        MockFeatureSidebarComponent,
        MockChatHistoryComponent,
        MockChatInputComponent,
        MockToastHostComponent
      ],
      providers: [
        { provide: ChatStateService, useValue: chatStateSpy },
        { provide: ApiService, useValue: apiSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: AuthTokenService, useValue: authSpy }
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
      'Chat request failed',
      'Chat failed'
    );
  });

  it('should clear chat and notify', () => {
    component.clearChat();

    expect(chatStateSpy.clear).toHaveBeenCalled();
    expect(notificationSpy.info).toHaveBeenCalledWith(
      'Chat cleared',
      'The chat history has been removed.'
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
});