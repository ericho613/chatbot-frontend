import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { RagQueryDialogComponent } from './rag-query-dialog.component';
import { ApiService } from '../../services/api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { NotificationService } from '../../services/notification.service';
import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Pipe({ name: 't' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('RagQueryDialogComponent', () => {
  let component: RagQueryDialogComponent;
  let fixture: ComponentFixture<RagQueryDialogComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let chatStateSpy: jasmine.SpyObj<ChatStateService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['ragQuery']);
    chatStateSpy = jasmine.createSpyObj(
      'ChatStateService',
      ['addMessage', 'updateMessage'],
      {
        streamingEnabled: true,
        messages: []
      }
    );
    notificationSpy = jasmine.createSpyObj('NotificationService', ['error']);
    activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    chatStateSpy.addMessage.and.returnValue({
      id: 'assistant-1',
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      pending: true
    });

    await TestBed.configureTestingModule({
      declarations: [RagQueryDialogComponent, MockTranslatePipe],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ChatStateService, useValue: chatStateSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: NgbActiveModal, useValue: activeModalSpy },
        LanguageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RagQueryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not submit when query is empty', async () => {
    component.query = '   ';
    await component.submit();

    expect(apiSpy.ragQuery).not.toHaveBeenCalled();
  });

  it('should submit successfully and close modal', async () => {
    component.query = 'What is in the vector store?';
    apiSpy.ragQuery.and.resolveTo('RAG answer');

    await component.submit();

    expect(chatStateSpy.addMessage).toHaveBeenCalledWith('assistant', '', true);
    expect(apiSpy.ragQuery).toHaveBeenCalled();
    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith('assistant-1', {
      content: 'RAG answer',
      pending: false
    });
    expect(activeModalSpy.close).toHaveBeenCalled();
  });

  it('should handle API error', async () => {
    component.query = 'fail me';
    apiSpy.ragQuery.and.rejectWith(new Error('Backend failed'));

    await component.submit();

    expect(notificationSpy.error).toHaveBeenCalledWith(
      component.languageService.t('notification.ragFailedTitle'),
      'Backend failed'
    );

    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith('assistant-1', {
      content: component.languageService.t('error.rag'),
      pending: false
    });

    expect(component.loading).toBeFalse();
  });
});