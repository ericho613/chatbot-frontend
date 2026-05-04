import { Component, Input } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { RagQueryDialogComponent } from '../dialogs/rag-query-dialog.component';
import { PdfSummaryDialogComponent } from '../dialogs/pdf-summary-dialog.component';
import { PdfCitationDialogComponent } from '../dialogs/pdf-citation-dialog.component';
import { PdfUploadDialogComponent } from '../dialogs/pdf-upload-dialog.component';
import { JwtGeneratorDialogComponent } from '../dialogs/jwt-generator-dialog.component';
import { SettingsDialogComponent } from '../dialogs/settings-dialog.component';

@Component({
  selector: 'app-feature-sidebar',
  templateUrl: './feature-sidebar.component.html',
  styleUrls: ['./feature-sidebar.component.scss'],
  standalone: false
})
export class FeatureSidebarComponent {
  @Input() mobileMode = false;

  expanded = false;

  constructor(private modal: NgbModal) {}

  get showLabels(): boolean {
    return this.mobileMode || this.expanded;
  }

  toggleSidebar(): void {
    if (this.mobileMode) return;
    this.expanded = !this.expanded;
  }

  openRag(): void {
    this.modal.open(RagQueryDialogComponent, { size: 'lg', centered: true });
  }

  openSummary(): void {
    this.modal.open(PdfSummaryDialogComponent, { size: 'lg', centered: true });
  }

  openCitation(): void {
    this.modal.open(PdfCitationDialogComponent, { size: 'lg', centered: true });
  }

  openUpload(): void {
    this.modal.open(PdfUploadDialogComponent, { size: 'lg', centered: true });
  }

  openJwt(): void {
    this.modal.open(JwtGeneratorDialogComponent, { size: 'lg', centered: true });
  }

  openSettings(): void {
    this.modal.open(SettingsDialogComponent, { size: 'md', centered: true });
  }
}