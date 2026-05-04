import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { ApiService } from './api.service';
import { AuthTokenService } from './auth-token.service';
import { StreamParserService } from './stream-parser.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  let authTokenService: jasmine.SpyObj<AuthTokenService>;
  let streamParser: jasmine.SpyObj<StreamParserService>;

  beforeEach(() => {
    const authSpy = jasmine.createSpyObj('AuthTokenService', ['getToken']);
    const parserSpy = jasmine.createSpyObj('StreamParserService', ['parseNdjsonStream']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ApiService,
        { provide: AuthTokenService, useValue: authSpy },
        { provide: StreamParserService, useValue: parserSpy }
      ]
    });

    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
    authTokenService = TestBed.inject(AuthTokenService) as jasmine.SpyObj<AuthTokenService>;
    streamParser = TestBed.inject(StreamParserService) as jasmine.SpyObj<StreamParserService>;

    authTokenService.getToken.and.returnValue('test-token');
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should send non-streaming basic chat request', async () => {
    const promise = service.basicChat({
      messages: [{ role: 'user', content: 'Hello' }],
      stream: false,
      generation_config: { max_tokens: 100, temperature: 0.7, top_p: 1.0 }
    });

    const req = httpMock.expectOne('http://localhost:8000/chat');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token');

    req.flush({
      success: true,
      model: 'gpt-4o-mini',
      response: 'Hi there'
    });

    const result = await promise;
    expect(result).toBe('Hi there');
  });
});