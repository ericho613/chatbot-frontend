import { TestBed } from '@angular/core/testing';
import { ChatStateService } from './chat-state.service';

describe('ChatStateService', () => {
  let service: ChatStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChatStateService);
  });

  it('should add a message', () => {
    const msg = service.addMessage('user', 'Hello');
    expect(msg.content).toBe('Hello');
    expect(service.messages.length).toBe(1);
    expect(service.messages[0].role).toBe('user');
  });

  it('should update a message', () => {
    const msg = service.addMessage('assistant', 'Old');
    service.updateMessage(msg.id, { content: 'New', pending: false });

    expect(service.messages[0].content).toBe('New');
    expect(service.messages[0].pending).toBeFalse();
  });

  it('should clear messages', () => {
    service.addMessage('user', 'A');
    service.addMessage('assistant', 'B');
    service.clear();

    expect(service.messages.length).toBe(0);
  });

  it('should toggle streaming', () => {
    service.setStreamingEnabled(false);
    expect(service.streamingEnabled).toBeFalse();

    service.setStreamingEnabled(true);
    expect(service.streamingEnabled).toBeTrue();
  });
});