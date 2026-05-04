import { Component, ChangeDetectorRef } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { SelectedFileItem } from '../../models/chatbot.models';
import { ApiService } from '../../services/api.service';
import { ChatStateService } from '../../services/chat-state.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-pdf-upload-dialog',
  templateUrl: './pdf-upload-dialog.component.html',
  standalone: false
})
export class PdfUploadDialogComponent {
  selectedFiles: SelectedFileItem[] = [];
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private api: ApiService,
    private chatState: ChatStateService,
    private notifications: NotificationService,
    private changeDetector: ChangeDetectorRef
  ) {}

  onFilesSelected(files: File[]): void {
    const normalized = files.map(file => ({
      file,
      name: file.name,
      size: file.size
    }));

    this.selectedFiles = [...this.selectedFiles, ...normalized];
  }

  removeFile(index: number): void {
    this.selectedFiles.splice(index, 1);
    this.selectedFiles = [...this.selectedFiles];
  }

  async submit(): Promise<void> {
    if (!this.selectedFiles.length || this.loading) return;

    this.loading = true;
    this.changeDetector.detectChanges();

    try {
      const statusLines: string[] = [];

      for (const item of this.selectedFiles) {
        const result = await this.api.uploadPdfToVectorDb(item.file);
        statusLines.push(result);
      }

      this.chatState.addMessage('assistant', statusLines.join('\n\n'));
      this.activeModal.close();
    } catch (error: any) {
      this.chatState.addMessage(
        'assistant',
        'Sorry, an error occurred while uploading or indexing the PDF file(s).'
      );
      this.notifications.error('PDF upload failed', error?.message || 'Unable to upload one or more PDF files.');
    } finally {
      this.loading = false;
      this.changeDetector.detectChanges();
    }
  }
}