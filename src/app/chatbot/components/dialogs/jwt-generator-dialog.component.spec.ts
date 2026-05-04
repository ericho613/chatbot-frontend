import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { JwtGeneratorDialogComponent } from './jwt-generator-dialog.component';
import { AuthTokenService } from '../../services/auth-token.service';
import { NotificationService } from '../../services/notification.service';

describe('JwtGeneratorDialogComponent', () => {
  let component: JwtGeneratorDialogComponent;
  let fixture: ComponentFixture<JwtGeneratorDialogComponent>;
  let authSpy: jasmine.SpyObj<AuthTokenService>;
  let notificationSpy: jasmine.SpyObj<NotificationService>;
  let activeModalSpy: jasmine.SpyObj<NgbActiveModal>;

  beforeEach(async () => {
    authSpy = jasmine.createSpyObj('AuthTokenService', ['generateAndStoreToken']);
    notificationSpy = jasmine.createSpyObj('NotificationService', ['success', 'error']);
    activeModalSpy = jasmine.createSpyObj('NgbActiveModal', ['close', 'dismiss']);

    await TestBed.configureTestingModule({
      declarations: [JwtGeneratorDialogComponent],
      imports: [FormsModule],
      providers: [
        { provide: AuthTokenService, useValue: authSpy },
        { provide: NotificationService, useValue: notificationSpy },
        { provide: NgbActiveModal, useValue: activeModalSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JwtGeneratorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should not generate token for empty secret', async () => {
    component.secret = '  ';

    await component.generate();

    expect(authSpy.generateAndStoreToken).not.toHaveBeenCalled();
  });

  it('should generate token and close modal', async () => {
    component.secret = 'my-secret';
    authSpy.generateAndStoreToken.and.resolveTo('jwt-token');

    await component.generate();

    expect(authSpy.generateAndStoreToken).toHaveBeenCalledWith('my-secret');
    expect(notificationSpy.success).toHaveBeenCalled();
    expect(activeModalSpy.close).toHaveBeenCalled();
  });

  it('should show error if token generation fails', async () => {
    component.secret = 'my-secret';
    authSpy.generateAndStoreToken.and.rejectWith(new Error('JWT failed'));

    await component.generate();

    expect(notificationSpy.error).toHaveBeenCalledWith(
      'JWT generation failed',
      'JWT failed'
    );
  });
});