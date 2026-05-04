import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ChatInputComponent } from './chat-input.component';

describe('ChatInputComponent', () => {
  let component: ChatInputComponent;
  let fixture: ComponentFixture<ChatInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ChatInputComponent],
      imports: [FormsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChatInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit sendMessage on submit', () => {
    spyOn(component.sendMessage, 'emit');

    component.text = 'Hello world';
    component.submit();

    expect(component.sendMessage.emit).toHaveBeenCalledWith('Hello world');
    expect(component.text).toBe('');
  });

  it('should not emit empty message', () => {
    spyOn(component.sendMessage, 'emit');

    component.text = '   ';
    component.submit();

    expect(component.sendMessage.emit).not.toHaveBeenCalled();
  });

  it('should submit on Enter without Shift', () => {
    spyOn(component, 'submit');

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    spyOn(event, 'preventDefault');

    component.onKeydown(event);

    expect(event.preventDefault).toHaveBeenCalled();
    expect(component.submit).toHaveBeenCalled();
  });
});