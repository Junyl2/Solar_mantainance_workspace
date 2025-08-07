import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalWeatherBoardComponent } from './total-weather-board.component';

describe('TotalWeatherBoardComponent', () => {
  let component: TotalWeatherBoardComponent;
  let fixture: ComponentFixture<TotalWeatherBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TotalWeatherBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalWeatherBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
