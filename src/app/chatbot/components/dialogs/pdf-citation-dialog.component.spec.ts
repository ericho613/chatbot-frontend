import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { PdfCitationDialogComponent } from './pdf-citation-dialog.component';
import { FileDropzoneComponent } from './file-dropzone.component';
import { ApiService } from '../../services/api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { NotificationService } from '../../services/notification.service';

describe('PdfCitationDialogComponent', () => {
  let component: PdfCitationDialogComponent;
  let fixture: ComponentFixture<PdfCitationDialogComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let chatStateSpy: jasmine.SpyObj<ChatStateService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['generateCitation']);
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
      declarations: [PdfCitationDialogComponent, FileDropzoneComponent],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ChatStateService, useValue: chatStateSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: NgbActiveModal, useValue: activeModalSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PdfCitationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should submit citation request successfully', async () => {
    const file = new File(['x'], 'paper.pdf', { type: 'application/pdf' });
    component.onFilesSelected([file]);
    component.citationStyle = 'MLA';
    apiSpy.generateCitation.and.resolveTo('Generated citation');

    await component.submit();

    expect(apiSpy.generateCitation).toHaveBeenCalled();
    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith('assistant-1', {
      content: 'Generated citation',
      pending: false
    });
    expect(activeModalSpy.close).toHaveBeenCalled();
  });

  it('should notify on citation failure', async () => {
    const file = new File(['x'], 'paper.pdf', { type: 'application/pdf' });
    component.onFilesSelected([file]);
    apiSpy.generateCitation.and.rejectWith(new Error('Citation failed'));

    await component.submit();

    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith('assistant-1', {
      content: 'Sorry, an error occurred while generating the citation.',
      pending: false
    });

    expect(notificationSpy.error).toHaveBeenCalledWith(
      'Citation generation failed',
      'Citation failed'
    );
  });
});