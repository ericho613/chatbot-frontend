import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { FeatureSidebarComponent } from './feature-sidebar.component';

describe('FeatureSidebarComponent', () => {
  let component: FeatureSidebarComponent;
  let fixture: ComponentFixture<FeatureSidebarComponent>;
  let modalSpy: jasmine.SpyObj<NgbModal>;

  beforeEach(async () => {
    modalSpy = jasmine.createSpyObj('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      declarations: [FeatureSidebarComponent],
      providers: [{ provide: NgbModal, useValue: modalSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(FeatureSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should toggle sidebar state', () => {
    expect(component.expanded).toBeFalse();
    component.toggleSidebar();
    expect(component.expanded).toBeTrue();
  });

  it('should open RAG modal', () => {
    component.openRag();
    expect(modalSpy.open).toHaveBeenCalled();
  });

  it('should render features in requested order', () => {
    component.expanded = true;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text.indexOf('RAG Query')).toBeLessThan(text.indexOf('Summary Generator'));
    expect(text.indexOf('Summary Generator')).toBeLessThan(text.indexOf('Citation Generator'));
    expect(text.indexOf('Citation Generator')).toBeLessThan(text.indexOf('Upload to Vector Database'));
    expect(text.indexOf('Upload to Vector Database')).toBeLessThan(text.indexOf('JWT Generator'));
    expect(text.indexOf('JWT Generator')).toBeLessThan(text.indexOf('Settings'));
  });

  it('should show labels in mobile mode', () => {
    component.mobileMode = true;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).toContain('RAG Query');
    expect(text).toContain('Settings');
  });
});