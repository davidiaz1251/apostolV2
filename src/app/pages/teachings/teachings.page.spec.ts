import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TeachingsPage } from './teachings.page';

describe('TeachingsPage', () => {
  let component: TeachingsPage;
  let fixture: ComponentFixture<TeachingsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(TeachingsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
