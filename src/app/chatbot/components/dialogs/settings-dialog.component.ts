import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ChatStateService } from '../../services/chat-state.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-settings-dialog',
  templateUrl: './settings-dialog.component.html',
  styleUrls: ['./settings-dialog.component.scss'],
  standalone: false
})
export class SettingsDialogComponent {
  constructor(
    public activeModal: NgbActiveModal,
    public chatState: ChatStateService,
    public languageService: LanguageService
  ) {}

  setStreaming(value: boolean): void {
    this.chatState.setStreamingEnabled(value);
  }
}