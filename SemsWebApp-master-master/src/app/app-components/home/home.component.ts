import {Component, ViewChild, OnInit, AfterViewInit, OnDestroy, Output, EventEmitter, Input} from '@angular/core';

import { GenerationBoardComponent } from './generation-board/generation-board.component';

// Timer
import { timer, Subscription, Observable } from 'rxjs';


// Service
import { ThemeService } from '../../services/theme-service';
import { SemsService } from 'src/app/services/sems-service';
import {
  SolarEnergyGenerationBoardComponent
} from "./solar-energy-generation-board/solar-energy-generation-board.component";
// import {TotalGenerationBoardComponent} from "./total-generation-board/total-generation-board.component";



export interface Facility {
  id: number;
  title: string;
}

export interface Config {
  title: string;
  subTitle: string;
  api1: string;
  api2: string;
  colorIndex: number;
  barChartFieldName: string;
  fieldName: string;
  unit: string;
}

@Component({
  selector: 'home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('solarEnergyGenerationBarChart') solarEnergyGenerationBarChart! :SolarEnergyGenerationBoardComponent;
  // totalGenerationBoardComponent: TotalGenerationBoardComponent;

  theme:string = "test";
  private timer: Observable<number>;
  private subscription: Subscription;

  temp : number = 0;
  humi : number = 0;
  dir : number = 0;
  wind : number = 0;
  solar : number = 0;
  updateTime:Date = new Date();

  public config =  {
    solar: {
      title: '태양광 발전',
      subTitle: 'PV GENERATION TREND',
      api1: '/invertor/pv-generation/daily',
      api2: '/invertor/pv-generation/stat',
      colorIndex: 0,
      barChartFieldName: 'powerAvg',
      fieldName: 'generation',
      unit: 'kWh',
    },
    utilizationRate: {
      title: '이용률',
      subTitle: 'UTILIZATION RATE TREND',
      api1: '/invertor/utilization-rate/daily',
      api2: '/invertor/utilization-rate/stat',
      colorIndex: 1,
      barChartFieldName: 'utilizationRate',
      fieldName: 'utilizationRate',
      unit: '%',
    },
    performanceRatio: {
      title: '발전성능',
      subTitle: 'POWER GENERATION PERFORMANCE TREND',
      api1: '/pgp/daily',
      api2: '/pgp/stat',
      colorIndex: 2,
      barChartFieldName: 'performance',
      fieldName: 'performance',
      unit: '%',
    },
    conversionEfficiency: {
      title: '변환효율',
      subTitle: 'CONVERSION EFFICIENCY TREND',
      api1: '/invertor/conversion-efficiency/daily',
      api2: '/invertor/conversion-efficiency/stat',
      colorIndex: 3,
      barChartFieldName: 'conversionEfficiency',
      fieldName: 'conversionEfficiency',
      unit: '%',
    }
  }


  constructor(private semsService: SemsService, private themeService : ThemeService) {
  }

  ngOnInit() {
    console.log('[HomeComponent]');
  }

  onUpdateData(object:string, n:number) {
    this.semsService.getWeatherLastInformation()
      .subscribe((res) => {
        const apiData = res;

        this.temp = apiData?.temperature;
        this.humi = apiData?.humidity;
        this.dir = apiData?.wd;
        this.wind = apiData?.ws;
        this.solar = apiData?.irradiance;
      })
  }

  ngAfterViewInit()   {
    this.timer = timer(0, 5000);
    console.log(this.timer);
    this.subscription = this.timer.subscribe(n => {
      this.updateTime = new Date();
      this.onUpdateData('timer', n)
    });

  }

  ngOnDestroy(): void {
    console.log(this.subscription);
    if(this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}
