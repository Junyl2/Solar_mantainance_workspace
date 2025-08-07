import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarEfficiencyComponent } from './solar-efficiency.component';

describe('SolarEfficiencyComponent', () => {
  let component: SolarEfficiencyComponent;
  let fixture: ComponentFixture<SolarEfficiencyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SolarEfficiencyComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SolarEfficiencyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
