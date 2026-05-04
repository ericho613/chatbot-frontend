import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChatHistoryComponent } from './chat-history.component';
import { MarkdownService } from '../../services/markdown.service';
import { DomSanitizer } from '@angular/platform-browser';

describe('ChatHistoryComponent', () => {
  let component: ChatHistoryComponent;
  let fixture: ComponentFixture<ChatHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatHistoryComponent],
      providers: [MarkdownService, DomSanitizer]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatHistoryComponent);
    component = fixture.componentInstance;

    component.messages = [
      { id: '1', role: 'user', content: 'Hello', timestamp: Date.now() },
      { id: '2', role: 'assistant', content: 'Hi', timestamp: Date.now() }
    ];

    component.clearRequested = jasmine.createSpy('clearRequested');
    component.copyRequested = jasmine.createSpy('copyRequested');

    fixture.detectChanges();
  });

  it('should render chat messages', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Hello');
    expect(compiled.textContent).toContain('Hi');
  });

  it('should call clearRequested when clear button is clicked', () => {
    component.hovered = true;
    fixture.detectChanges();

    const buttons = fixture.nativeElement.querySelectorAll('.icon-btn') as NodeListOf<HTMLButtonElement>;
    buttons[1].click();

    expect(component.clearRequested).toHaveBeenCalled();
  });
});