import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarQuantityComponent } from './solar-quantity.component';

describe('SolarQuantityComponent', () => {
  let component: SolarQuantityComponent;
  let fixture: ComponentFixture<SolarQuantityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SolarQuantityComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SolarQuantityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
