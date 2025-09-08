import { Component, Input, OnInit } from '@angular/core';
import { ResizedEvent } from 'angular-resize-event';

// Services ------------------------------------
import { ThemeService } from '../../../services/theme-service';
import { SemsService } from 'src/app/services/sems-service';
// End Services

import {
  faTint,
  faCloudSunRain,
  faSun,
  faTemperatureHigh,
  faWind,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { OntestUtils } from 'src/app/utils/ontest-utils';

@Component({
  selector: 'app-weather-board',
  templateUrl: './weather-board.component.html',
  styleUrls: ['./weather-board.component.scss'],
})
export class WeatherBoardComponent implements OnInit {
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  // Font awesome (wind direction removed)
  faTemperatureHigh = faTemperatureHigh;
  faTint = faTint;
  faWind = faWind;
  faSun = faSun;
  faCloudSunRain = faCloudSunRain;
  faBolt = faBolt;

  // Data -------------------------
  @Input() temp: number = 0;
  @Input() humi: number = 0;
  @Input() wind: number = 0;

  // New solar radiation inputs (three types)
  @Input() solarGHI: number = 0;
  @Input() solarDNI: number = 0;
  @Input() solarDHI: number = 0;

  constructor(
    public themeService: ThemeService,
    private semsService: SemsService
  ) {}

  ngOnInit(): void {}

  onResized(event: ResizedEvent) {
    // this.canvasWidth = event.newRect.width;
  }
}
