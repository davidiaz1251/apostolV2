import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TemaDetailPage } from './tema-detail.page';

describe('TemaDetailPage', () => {
  let component: TemaDetailPage;
  let fixture: ComponentFixture<TemaDetailPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TemaDetailPage],
    });
    fixture = TestBed.createComponent(TemaDetailPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
