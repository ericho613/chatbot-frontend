import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { PdfUploadDialogComponent } from './pdf-upload-dialog.component';
import { FileDropzoneComponent } from './file-dropzone.component';
import { ApiService } from '../../services/api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { NotificationService } from '../../services/notification.service';

describe('PdfUploadDialogComponent', () => {
  let component: PdfUploadDialogComponent;
  let fixture: ComponentFixture<PdfUploadDialogComponent>;
  let apiSpy: jasmine.SpyObj<ApiService>;
  let chatStateSpy: jasmine.SpyObj<ChatStateService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    apiSpy = jasmine.createSpyObj('ApiService', ['uploadPdfToVectorDb']);
    chatStateSpy = jasmine.createSpyObj('ChatStateService', ['addMessage']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['error']);
    activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      declarations: [PdfUploadDialogComponent, FileDropzoneComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        { provide: ChatStateService, useValue: chatStateSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: NgbActiveModal, useValue: activeModalSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PdfUploadDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should append selected files', () => {
    const file1 = new File(['1'], 'a.pdf', { type: 'application/pdf' });
    const file2 = new File(['2'], 'b.pdf', { type: 'application/pdf' });

    component.onFilesSelected([file1, file2]);

    expect(component.selectedFiles.length).toBe(2);
  });

  it('should upload all files and add combined status message', async () => {
    const file1 = new File(['1'], 'a.pdf', { type: 'application/pdf' });
    const file2 = new File(['2'], 'b.pdf', { type: 'application/pdf' });
    component.onFilesSelected([file1, file2]);

    apiSpy.uploadPdfToVectorDb.and.resolveTo('Upload OK');

    await component.submit();

    expect(apiSpy.uploadPdfToVectorDb).toHaveBeenCalledTimes(2);
    expect(chatStateSpy.addMessage).toHaveBeenCalledWith('assistant', 'Upload OK\n\nUpload OK');
    expect(activeModalSpy.close).toHaveBeenCalled();
  });

  it('should notify on upload failure', async () => {
    const file = new File(['1'], 'a.pdf', { type: 'application/pdf' });
    component.onFilesSelected([file]);

    apiSpy.uploadPdfToVectorDb.and.rejectWith(new Error('Upload failed'));

    await component.submit();

    expect(chatStateSpy.addMessage).toHaveBeenCalledWith(
      'assistant',
      'Sorry, an error occurred while uploading or indexing the PDF file(s).'
    );

    expect(notificationSpy.error).toHaveBeenCalledWith(
      'PDF upload failed',
      'Upload failed'
    );
  });
});