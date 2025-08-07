import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadWeatherComponent } from './download-weather.component';

describe('DownloadWeatherComponent', () => {
  let component: DownloadWeatherComponent;
  let fixture: ComponentFixture<DownloadWeatherComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadWeatherComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadWeatherComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
