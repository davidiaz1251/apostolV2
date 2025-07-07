import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PracticesPage } from './practices.page';

describe('PracticesPage', () => {
  let component: PracticesPage;
  let fixture: ComponentFixture<PracticesPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(PracticesPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
