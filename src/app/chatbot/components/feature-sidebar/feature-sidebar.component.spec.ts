import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { FeatureSidebarComponent } from './feature-sidebar.component';
import { Pipe, PipeTransform } from '@angular/core';
import { LanguageService } from '../../services/language.service';

@Pipe({ name: 't' })
class MockTranslatePipe implements PipeTransform {
  transform(value: string): string {
    return value;
  }
}

describe('FeatureSidebarComponent', () => {
  let component: FeatureSidebarComponent;
  let fixture: ComponentFixture<FeatureSidebarComponent>;
  let modalSpy: jasmine.SpyObj<NgbModal>;

  beforeEach(async () => {
    modalSpy = jasmine.createSpyObj('NgbModal', ['open']);

    await TestBed.configureTestingModule({
      declarations: [FeatureSidebarComponent, MockTranslatePipe],
      providers: [{ provide: NgbModal, useValue: modalSpy }, LanguageService]
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
    expect(text.indexOf('sidebar.rag')).toBeLessThan(text.indexOf('sidebar.summary'));
    expect(text.indexOf('sidebar.summary')).toBeLessThan(text.indexOf('sidebar.citation'));
    expect(text.indexOf('sidebar.citation')).toBeLessThan(text.indexOf('sidebar.upload'));
    expect(text.indexOf('sidebar.upload')).toBeLessThan(text.indexOf('sidebar.jwt'));
    expect(text.indexOf('sidebar.jwt')).toBeLessThan(text.indexOf('sidebar.settings'));
  });

  it('should show labels in mobile mode', () => {
    component.mobileMode = true;
    fixture.detectChanges();

    const text = (fixture.nativeElement as HTMLElement).textContent || '';
    expect(text).toContain('sidebar.rag');
    expect(text).toContain('sidebar.settings');
  });
});