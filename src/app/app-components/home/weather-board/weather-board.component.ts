import { Component, Input, OnInit } from '@angular/core';

// Services ------------------------------------
import { ThemeService } from '../../../services/theme-service';

// End Services

import {
  faTint,
  faCloudSunRain,
  faSun,
  faTemperatureHigh,
  faWind,
  faLocationArrow,
  faBolt,
} from '@fortawesome/free-solid-svg-icons';
import { OntestUtils } from 'src/app/utils/ontest-utils';
import { SemsService } from 'src/app/services/sems-service';

@Component({
  selector: 'app-weather-board',
  templateUrl: './weather-board.component.html',
  styleUrls: ['./weather-board.component.scss'],
})
export class WeatherBoardComponent implements OnInit {
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  // Font awesome -----------------
  faTemperatureHigh = faTemperatureHigh;
  faTint = faTint;
  faWind = faWind;
  faLocationArrow = faLocationArrow;
  faSun = faSun;
  faCloudSunRain = faCloudSunRain;
  faBolt = faBolt;

  // Data -------------------------
  @Input() temp: number = 0;
  @Input() humi: number = 0;
  @Input() winddir: number = 0;
  @Input() wind: number = 0;
  @Input() solar: number = 0;

  constructor(
    public themeService: ThemeService,
    private semsService: SemsService
  ) {}

  ngOnInit(): void {}
}
