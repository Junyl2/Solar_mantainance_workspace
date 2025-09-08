import {
  Component,
  ViewChild,
  OnInit,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';

import { timer, Subscription, Observable } from 'rxjs';

// Service
import { ThemeService } from '../../services/theme-service';
import { SemsService } from 'src/app/services/sems-service';

import { SolarEnergyGenerationBoardComponent } from './solar-energy-generation-board/solar-energy-generation-board.component';

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
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('solarEnergyGenerationBarChart')
  solarEnergyGenerationBarChart!: SolarEnergyGenerationBoardComponent;

  theme: string = 'test';
  private timer$!: Observable<number>;
  private subscription!: Subscription;

  // Weather data shown on app-weather-board
  temp: number = 0;
  humi: number = 0;
  wind: number = 0;

  // Three solar radiation types (kW/m²)
  solarGHI: number = 0; // ← irradiance1
  solarDNI: number = 0; // ← irradiance2
  solarDHI: number = 0; // ← irradiance3

  updateTime: Date = new Date();

  public config = {
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
    },
  };

  constructor(
    private semsService: SemsService,
    private themeService: ThemeService
  ) {}

  ngOnInit() {
    console.log('[HomeComponent]');
  }

  // Kept your signature for compatibility
  onUpdateData(_object: string, _n: number) {
    this.updateWeather();
  }

  ngAfterViewInit() {
    this.timer$ = timer(0, 5000);
    this.subscription = this.timer$.subscribe((n) => {
      this.onUpdateData('timer', n);
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  /**
   * Fetch latest weather info and map to UI fields.
   * Uses your real keys:
   *  - temp/humi/wind  ← temperature/humidity/ws
   *  - GHI/DNI/DHI     ← irradiance1/irradiance2/irradiance3
   * Normalizes to kW/m² and clamps negatives to zero.
   */
  private updateWeather() {
    this.semsService.getWeatherLastInformation().subscribe((raw: any) => {
      if (!raw) return;

      // Scalars
      this.temp = this.num(raw.temperature);
      this.humi = this.num(raw.humidity);
      this.wind = this.num(raw.ws);

      // Map exact fields from your payload
      const ghiRaw = this.numOrNull(raw.irradiance1); // GHI
      const dniRaw = this.numOrNull(raw.irradiance2); // DNI
      const dhiRaw = this.numOrNull(raw.irradiance3); // DHI

      // Normalize to kW/m² and clamp to >= 0
      /*   this.solarGHI = this.toKWM2Clamped(ghiRaw);
      this.solarDNI = this.toKWM2Clamped(dniRaw);
      this.solarDHI = this.toKWM2Clamped(dhiRaw); */
      this.solarGHI = this.toKWM2(ghiRaw);
      this.solarDNI = this.toKWM2(dniRaw);
      this.solarDHI = this.toKWM2(dhiRaw);

      // Update time from API if present
      this.updateTime = raw.dateTime ? new Date(raw.dateTime) : new Date();
    });
  }

  // ===== helpers =====
  private num(v: any): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  private numOrNull(v: any): number | null {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  /**
   * Normalize irradiance to kW/m² and clamp negatives to 0.
   * Heuristic:
   *  - If magnitude >= 10, assume W/m² → divide by 1000.
   *  - Else assume already kW/m² (typical tiny magnitudes at night).
   */
  /*   private toKWM2Clamped(value: number | null): number {
    if (value == null) return 0;
    const abs = Math.abs(value);
    const normalized = abs >= 10 ? value / 1000 : value;
    return Math.max(0, normalized);
  } */
  private toKWM2(value: number | null): number {
    if (value == null) return 0;
    const n = Number(value);
    if (Number.isNaN(n)) return 0;

    // Heuristic: if magnitude >= 10, assume W/m² → convert to kW/m²
    return Math.abs(n) >= 10 ? n / 1000 : n;
  }
}
