import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileDropzoneComponent } from './file-dropzone.component';
import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Pipe({ name: 't' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('FileDropzoneComponent', () => {
  let component: FileDropzoneComponent;
  let fixture: ComponentFixture<FileDropzoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileDropzoneComponent, MockTranslatePipe],
      providers: [LanguageService]
    }).compileComponents();

    fixture = TestBed.createComponent(FileDropzoneComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should emit selected PDF files from input', () => {
    spyOn(component.filesSelected, 'emit');

    const file = new File(['dummy'], 'test.pdf', { type: 'application/pdf' });
    const input = document.createElement('input');
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    Object.defineProperty(input, 'files', {
      value: dataTransfer.files
    });

    const event = { target: input } as unknown as Event;
    component.onFileInputChange(event);

    expect(component.filesSelected.emit).toHaveBeenCalled();
  });

  it('should remove file by index', () => {
    spyOn(component.fileRemoved, 'emit');
    component.remove(0);
    expect(component.fileRemoved.emit).toHaveBeenCalledWith(0);
  });

  it('should format KB and MB sizes', () => {
    expect(component.formatSize(1024)).toContain('KB');
    expect(component.formatSize(2 * 1024 * 1024)).toContain('MB');
  });
});