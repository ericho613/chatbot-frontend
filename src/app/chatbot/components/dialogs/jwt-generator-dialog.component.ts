import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AuthTokenService } from '../../services/auth-token.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-jwt-generator-dialog',
  templateUrl: './jwt-generator-dialog.component.html',
  standalone: false
})
export class JwtGeneratorDialogComponent {
  secret = '';
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private authTokenService: AuthTokenService,
    private notifications: NotificationService
  ) {}

  async generate(): Promise<void> {
    if (!this.secret.trim() || this.loading) return;

    this.loading = true;

    try {
      await this.authTokenService.generateAndStoreToken(this.secret.trim());
      this.notifications.success(
        'JWT generated',
        'A new JWT has been generated and stored in the chatbotAccessToken cookie.'
      );
      this.activeModal.close();
    } catch (error: any) {
      this.notifications.error('JWT generation failed', error?.message || 'Unable to generate JWT.');
    } finally {
      this.loading = false;
    }
  }
}