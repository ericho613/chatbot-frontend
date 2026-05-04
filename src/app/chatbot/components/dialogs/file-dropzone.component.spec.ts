import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FileDropzoneComponent } from './file-dropzone.component';

describe('FileDropzoneComponent', () => {
  let component: FileDropzoneComponent;
  let fixture: ComponentFixture<FileDropzoneComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FileDropzoneComponent]
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