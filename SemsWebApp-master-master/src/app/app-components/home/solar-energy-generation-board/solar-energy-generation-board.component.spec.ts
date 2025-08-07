import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SolarEnergyGenerationBoardComponent } from './solar-energy-generation-board.component';

describe('SolarEnergyGenerationBoardComponent', () => {
  let component: SolarEnergyGenerationBoardComponent;
  let fixture: ComponentFixture<SolarEnergyGenerationBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SolarEnergyGenerationBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SolarEnergyGenerationBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
