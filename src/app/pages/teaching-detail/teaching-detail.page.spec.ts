import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeachingDetailPage } from './teaching-detail.page';

describe('TeachingDetailPage', () => {
  let component: TeachingDetailPage;
  let fixture: ComponentFixture<TeachingDetailPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeachingDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
