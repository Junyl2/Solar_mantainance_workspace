import {
  Component,
  OnInit,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
  AfterContentChecked,
  ChangeDetectorRef,
} from '@angular/core';

// Angular Material Datepicker
import { MatDatepicker } from '@angular/material/datepicker';
import { Moment } from 'moment';

import moment from 'moment';

// Services
import { SemsService } from '../../services/sems-service';
import { DateAdapter } from '@angular/material/core';

// Components
import { BarChartComponent } from '../../ui-components/bar-chart/bar-chart.component';

// Utils
import { DateUtils } from '../../utils/date-utils';
import { ChartJsUtils } from '../../utils/chartjs-utils';
import { format } from 'date-fns';
import { OntestUtils } from 'src/app/utils/ontest-utils';
import { WeatherInfoSummary } from 'src/app/models/weather-info-summary';

@Component({
  selector: 'app-solar-quantity',
  templateUrl: './solar-quantity.component.html',
  styleUrls: ['./solar-quantity.component.scss'],
  providers: [],
})
export class SolarQuantityComponent
  implements OnInit, AfterViewInit, AfterContentChecked
{
  @ViewChild('barchartMonthly') barchartMonthly!: BarChartComponent;
  @ViewChild('barchartDaily') barchartDaily!: BarChartComponent;
  @ViewChild('barchartHourly') barchartHourly!: BarChartComponent;

  // Utils
  private chartUtil: ChartJsUtils = new ChartJsUtils();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  showChart: boolean = true;
  pickerStartDate = new Date(2022, 0, 1);

  startYMat!: Date;
  endYMat!: Date;

  viewChart = (show: boolean) => {
    if (show) {
      this.showChart = true;
    } else {
      this.showChart = false;
    }
  };

  // Monthly ----------------------
  startMonthlyDate: Date = new Date();
  startMinMonthlyDate!: Date;
  startMaxMonthlyDate!: Date;
  endMonthlyDate: Date = new Date();
  endMinMonthlyDate!: Date;
  endMaxMonthlyDate!: Date;
  chartMonthlyLabels!: string[];
  tableMonthlyLabels!: string[];
  tableMonthlyData!: WeatherInfoSummary[];

  // Daily -------------------------
  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate!: Date;
  endMaxDailyDate!: Date;
  chartDailyLabels!: string[];
  tableDailyLabels!: string[];
  tableDailyData!: WeatherInfoSummary[];

  // Hourly --------------------------
  timeDate: Date = new Date();
  minTimeDate!: Date;
  maxTimeDate!: Date;
  chartTimeLabels!: string[];
  tableTimeLabels!: string[];
  tableTimeData!: WeatherInfoSummary[];

  constructor(
    private semsService: SemsService,
    private dateAdapter: DateAdapter<any>,
    private cdRef: ChangeDetectorRef
  ) {
    // Monthly ----------------------
    this.startMinMonthlyDate = this.semsService.getInstalledDate();
    this.startMaxMonthlyDate = moment().toDate();
    this.endMinMonthlyDate = this.startMinMonthlyDate;
    this.endMaxMonthlyDate = this.startMaxMonthlyDate;
    this.startMonthlyDate = this.startMinMonthlyDate;
    this.endMonthlyDate = moment().toDate();

    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate =
      this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = moment().toDate();

    this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();

    // Time ---------------------------
    this.timeDate = this.maxTimeDate = moment().toDate();
    this.minTimeDate = this.semsService.getInstalledDate();
  }

  site;

  /** Keep only IRRADIANCE1/2/3 and label as IRRADIANCE{N}[insNum] */
  private toIrradianceLegend<T extends { insName: string; insNum?: any }>(
    rows: T[]
  ): (T & { displayName: string })[] {
    const ALLOWED = new Set(['IRRADIANCE1', 'IRRADIANCE2', 'IRRADIANCE3']);
    return rows
      .filter((r) => ALLOWED.has(r.insName))
      .map((r) => ({
        ...r,
        displayName: r.insNum != null ? `${r.insName}[${r.insNum}]` : r.insName,
      }));
  }

  /** If a stray dataset named '일사량' ever appears, remove it */
  private stripStrayDailySum(chartRef: BarChartComponent | undefined) {
    const c: any = chartRef as any;
    const chart = c?.chart; // underlying Chart.js instance if exposed
    if (!chart?.data?.datasets) return;
    chart.data.datasets = chart.data.datasets.filter(
      (d: any) => d?.label !== '일사량'
    );
    chart.update?.();
  }

  ngOnInit(): void {
    this.semsService.getSite().subscribe((res) => {
      this.site = res;
    });
  }

  ngAfterContentChecked(): void {}

  ngAfterViewInit(): void {
    // initialize scale on chart
    const scalesOption = {
      scales: {
        y: {
          id: 'y',
          type: 'linear',
          title: {
            text: '일사량 W/㎡',
            display: true,
            align: 'end',
          },
          display: true,
          position: 'left',
        },
      },
    };
    this.barchartMonthly.addConfigOptions(scalesOption);
    this.barchartHourly.addConfigOptions(scalesOption);
    this.barchartDaily.addConfigOptions(scalesOption);

    this.cdRef.detectChanges();

    // Monthly ---------------------------
    this.updateMonthlyPage();

    // Daily -----------------------------
    this.updateDailyPage();

    // Hours -----------------------------
    this.updateHourlyPage();
  }
  updateMonthlyPage(): void {
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(
      this.endMonthlyDate,
      this.startMonthlyDate
    );

    this.tableMonthlyLabels = ['일사량계', ...this.chartMonthlyLabels];
    this.barchartMonthly.resetDataset();

    this.semsService
      .getWeatherSummary(
        'MONTHLY',
        format(this.startMonthlyDate, 'yyyy-MM-dd'),
        format(this.endMonthlyDate, 'yyyy-MM-dd')
      )
      .subscribe((res) => {
        const apiData = res;
        const irradianceKeys = ['IRRADIANCE1', 'IRRADIANCE2', 'IRRADIANCE3'];

        this.tableMonthlyData = [];

        for (const key of irradianceKeys) {
          const filtered = apiData
            .filter((item) => item.insName === key)
            .map((item) => ({
              ...item,
              displayName: item.insName,
            }));

          const valueKey = key.toLowerCase(); // 'irradiance1', 'irradiance2', 'irradiance3'

          const result = this.onTestUtil.syncInvertorGridData(
            this.chartMonthlyLabels,
            filtered,
            valueKey,
            this.barchartMonthly,
            'yy-MM',
            undefined,
            undefined,
            this.site
          );

          this.tableMonthlyData.push(...result);
        }
      });
  }

  updateDailyPage(): void {
    // Chart Label
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(
      this.startDailyDate,
      this.endDailyDate
    );

    // Table First Labels
    this.tableDailyLabels = ['일사량계', ...this.chartDailyLabels];

    // Empty dataset
    this.barchartDaily.resetDataset();

    this.semsService
      .getWeatherSummary(
        'DAILY',
        format(this.startDailyDate, 'yyyy-MM-dd'),
        format(this.endDailyDate, 'yyyy-MM-dd')
      )
      .subscribe((res) => {
        const apiData = res;
        const irradianceKeys = ['IRRADIANCE1', 'IRRADIANCE2', 'IRRADIANCE3'];

        this.tableDailyData = [];

        for (const key of irradianceKeys) {
          const filtered = apiData
            .filter((item) => item.insName === key)
            .map((item) => ({
              ...item,
              displayName: item.insName,
            }));

          const valueKey = key.toLowerCase(); // 'irradiance1', 'irradiance2', 'irradiance3'

          const result = this.onTestUtil.syncInvertorGridData(
            this.chartDailyLabels,
            filtered,
            valueKey,
            this.barchartDaily,
            'MM-dd',
            undefined,
            undefined,
            this.site
          );

          this.tableDailyData.push(...result);
        }
      });
  }

  updateHourlyPage(): void {
    console.log('🌞 updateHourlyPage 호출됨, timeDate:', this.timeDate);

    // Chart Label
    this.chartTimeLabels = DateUtils.getSpanTimeStringArray();

    // Table First Labels
    this.tableTimeLabels = ['일사량계', ...this.chartTimeLabels];

    // Empty dataset
    this.barchartHourly.resetDataset();

    const inverterCount = this.semsService.getSolarCheckerCount();
    const dateParam = new Date(this.timeDate);
    const nextDate = new Date(dateParam);
    nextDate.setDate(nextDate.getDate() + 1);

    const startDateStr = format(dateParam, 'yyyy-MM-dd');
    const endDateStr = format(nextDate, 'yyyy-MM-dd');

    console.log('🌞 API 호출 파라미터:', {
      summaryType: 'HOURLY',
      startDate: startDateStr,
      endDate: endDateStr,
    });

    this.semsService
      .getWeatherSummary('HOURLY', startDateStr, endDateStr)
      .subscribe((res) => {
        console.log('🌞 API 응답 받음:', res);
        const apiData = res;
        const irradianceKeys = ['IRRADIANCE1', 'IRRADIANCE2', 'IRRADIANCE3'];

        this.tableTimeData = [];

        for (const key of irradianceKeys) {
          const filtered = apiData
            .filter((item) => item.insName === key)
            .map((item) => ({
              ...item,
              displayName: item.insName,
            }));

          const valueKey = key.toLowerCase(); // 'irradiance1', 'irradiance2', 'irradiance3'

          const result = this.onTestUtil.syncInvertorGridData(
            this.chartTimeLabels,
            filtered,
            valueKey,
            this.barchartHourly,
            'HH',
            'hourly',
            undefined,
            this.site
          );

          this.tableTimeData.push(...result);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges) {}

  // Monthly ------------------------------------------------------
  onStartMonthlyYearSelected(normalizedYear: Moment) {
    this.startMonthlyDate.setFullYear(normalizedYear.year());
  }
  onStartMonthlyMonthSelected(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Date>
  ) {
    this.startMonthlyDate.setFullYear(normalizedMonth.year());
    this.startMonthlyDate.setMonth(normalizedMonth.month());
    this.startMonthlyDate = new Date(this.startMonthlyDate);

    datepicker.close();
    // 자동으로 월별 데이터 업데이트
    this.updateMonthlyPage();
  }

  onEndMonthlyYearSelected(normalizedYear: Moment) {
    this.endMonthlyDate.setFullYear(normalizedYear.year());
  }
  onEndMonthlyMonthSelected(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Date>
  ) {
    this.endMonthlyDate = normalizedMonth.endOf('month').toDate();

    datepicker.close();
    // 자동으로 월별 데이터 업데이트
    this.updateMonthlyPage();
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    this.startDailyDate = normalizedDate.toDate();
    // 자동으로 일별 데이터 업데이트
    this.updateDailyPage();
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.toDate();
    // 자동으로 일별 데이터 업데이트
    this.updateDailyPage();
  }

  // Time ------------------------------------------------------------
  onHourlyDateSelected(selectedDate: any) {
    console.log('🌞 선택된 날짜 원본:', selectedDate);
    console.log('🌞 선택된 날짜 타입:', typeof selectedDate);

    // 다양한 날짜 타입 처리
    let newDate: Date;
    if (selectedDate && typeof selectedDate.toDate === 'function') {
      // Moment 객체인 경우
      newDate = selectedDate.toDate();
    } else if (selectedDate instanceof Date) {
      // Date 객체인 경우
      newDate = selectedDate;
    } else if (typeof selectedDate === 'string') {
      // 문자열인 경우
      newDate = new Date(selectedDate);
    } else {
      console.error('❌ 지원하지 않는 날짜 형식:', selectedDate);
      return;
    }

    console.log('🌞 변환된 날짜:', newDate);
    this.timeDate = newDate;
    console.log('🌞 설정된 timeDate:', this.timeDate);

    // 날짜 변경 시 자동 조회
    setTimeout(() => {
      console.log('⏰ updateHourlyPage 호출 시점의 timeDate:', this.timeDate);
      this.updateHourlyPage();
    }, 100);
  }
}
