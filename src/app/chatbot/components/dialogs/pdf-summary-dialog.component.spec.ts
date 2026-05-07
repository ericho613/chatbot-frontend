import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { PdfSummaryDialogComponent } from './pdf-summary-dialog.component';
import { FileDropzoneComponent } from './file-dropzone.component';
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

describe('PdfSummaryDialogComponent', () => {
  let component: PdfSummaryDialogComponent;
  let fixture: ComponentFixture<PdfSummaryDialogComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let chatStateSpy: jasmine.SpyObj<ChatStateService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['summarizePdf']);
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
      declarations: [PdfSummaryDialogComponent, FileDropzoneComponent, MockTranslatePipe],
      imports: [FormsModule],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ChatStateService, useValue: chatStateSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: NgbActiveModal, useValue: activeModalSpy },
        LanguageService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PdfSummaryDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should select a single file', () => {
    const file = new File(['x'], 'sample.pdf', { type: 'application/pdf' });

    component.onFilesSelected([file]);

    expect(component.selectedFiles.length).toBe(1);
    expect(component.selectedFiles[0].name).toBe('sample.pdf');
  });

  it('should remove selected file', () => {
    const file = new File(['x'], 'sample.pdf', { type: 'application/pdf' });
    component.onFilesSelected([file]);

    component.removeFile(0);

    expect(component.selectedFiles.length).toBe(0);
  });

  it('should submit summary request successfully', async () => {
    const file = new File(['x'], 'sample.pdf', { type: 'application/pdf' });
    component.onFilesSelected([file]);
    component.language = 'French';
    apiSpy.summarizePdf.and.resolveTo('Résumé généré');

    await component.submit();

    expect(apiSpy.summarizePdf).toHaveBeenCalled();
    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith('assistant-1', {
      content: 'Résumé généré',
      pending: false
    });
    expect(activeModalSpy.close).toHaveBeenCalled();
  });

  it('should notify on summary failure', async () => {
    const file = new File(['x'], 'sample.pdf', { type: 'application/pdf' });
    component.onFilesSelected([file]);
    apiSpy.summarizePdf.and.rejectWith(new Error('Summary failed'));

    await component.submit();

    expect(chatStateSpy.updateMessage).toHaveBeenCalledWith('assistant-1', {
      content: component.languageService.t('error.summary'),
      pending: false
    });

    expect(notificationSpy.error).toHaveBeenCalledWith(
      component.languageService.t('notification.summaryFailedTitle'),
      'Summary failed'
    );
  });
});