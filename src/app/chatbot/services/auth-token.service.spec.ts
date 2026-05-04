import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AuthTokenService } from './auth-token.service';

describe('AuthTokenService', () => {
  let service: AuthTokenService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthTokenService);
    localStorage.clear();
    document.cookie = 'chatbotAccessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  it('should generate and store a token', async () => {
    const token = await service.generateAndStoreToken('my-secret');
    expect(token).toContain('.');
    expect(service.getToken()).toBeTruthy();
    expect(service.getStoredSecret()).toBe('my-secret');
  });

  it('should clear token', async () => {
    await service.generateAndStoreToken('my-secret');
    expect(service.getToken()).toBeTruthy();

    service.clearToken();
    expect(service.getToken()).toBeNull();
  });

  it('should refresh token if secret exists', async () => {
    await service.generateAndStoreToken('my-secret');
    const refreshed = await service.refreshTokenIfPossible();
    expect(refreshed).toBeTruthy();
  });

  it('should return null on refresh if no secret exists', async () => {
    localStorage.removeItem('chatbotJwtSecret');
    const refreshed = await service.refreshTokenIfPossible();
    expect(refreshed).toBeNull();
  });
});