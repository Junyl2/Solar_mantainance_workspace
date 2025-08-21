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
import { WeatherInfoSummary } from 'src/app/models/weather-info-summary';
import { OntestUtils } from 'src/app/utils/ontest-utils';

@Component({
  selector: 'app-temp-humi',
  templateUrl: './temp-humi.component.html',
  styleUrls: ['./temp-humi.component.scss'],
  providers: [],
})
export class TempHumiComponent
  implements OnInit, AfterViewInit, AfterContentChecked
{
  @ViewChild('tempBarchartMonthly') tempBarchartMonthly!: BarChartComponent;
  @ViewChild('tempBarchartDaily') tempBarchartDaily!: BarChartComponent;
  @ViewChild('tempBarchartHourly') tempBarchartHourly!: BarChartComponent;

  @ViewChild('humiBarchartMonthly') humiBarchartMonthly!: BarChartComponent;
  @ViewChild('humiBarchartDaily') humiBarchartDaily!: BarChartComponent;
  @ViewChild('humiBarchartHourly') humiBarchartHourly!: BarChartComponent;

  // Utils
  private chartUtil: ChartJsUtils = new ChartJsUtils();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  showChart: boolean = true;
  pickerStartDate = new Date(2022, 0, 1);

  viewChart = (show: boolean) => {
    if (show) {
      this.showChart = true;
    } else {
      this.showChart = false;
    }
  };

  startYMat!: Date;
  endYMat!: Date;

  // Monthly ----------------------
  startMonthlyDate: Date = new Date();
  startMinMonthlyDate!: Date;
  startMaxMonthlyDate!: Date;
  endMonthlyDate: Date = new Date();
  endMinMonthlyDate!: Date;
  endMaxMonthlyDate!: Date;
  chartMonthlyLabels!: string[];
  tempTableMonthlyLabels!: string[];
  humiTableMonthlyLabels!: string[];
  tempTableMonthlyData!: WeatherInfoSummary[];
  humiTableMonthlyData!: WeatherInfoSummary[];

  // Daily -------------------------
  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate!: Date;
  endMaxDailyDate!: Date;
  chartDailyLabels!: string[];
  tempTableDailyLabels!: string[];
  humiTableDailyLabels!: string[];
  tempTableDailyData!: WeatherInfoSummary[];
  humiTableDailyData!: WeatherInfoSummary[];

  // Hourly --------------------------
  timeDate: Date = new Date();
  minTimeDate!: Date;
  maxTimeDate!: Date;
  chartTimeLabels!: string[];
  tempTableTimeLabels!: string[];
  humiTableTimeLabels!: string[];
  tempTableTimeData!: WeatherInfoSummary[];
  humiTableTimeData!: WeatherInfoSummary[];

  site: any;

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

  ngOnInit(): void {
    this.semsService.getSite().subscribe((res) => {
      this.site = res;
    });
  }

  ngAfterContentChecked(): void {}

  ngAfterViewInit(): void {
    // initialize scale on chart
    const scalesOptionTemperature = {
      scales: {
        y: {
          id: 'y',
          type: 'linear',
          title: {
            text: '온도 ℃',
            display: true,
            align: 'end',
          },
          display: true,
          position: 'left',
        },
      },
    };
    this.tempBarchartMonthly.addConfigOptions(scalesOptionTemperature);
    this.tempBarchartDaily.addConfigOptions(scalesOptionTemperature);
    this.tempBarchartHourly.addConfigOptions(scalesOptionTemperature);

    // initialize scale on chart
    const scalesOptionHumidity = {
      scales: {
        y: {
          id: 'y',
          type: 'linear',
          title: {
            text: '습도 %',
            display: true,
            align: 'end',
          },
          display: true,
          position: 'left',
        },
      },
    };
    this.humiBarchartMonthly.addConfigOptions(scalesOptionHumidity);
    this.humiBarchartDaily.addConfigOptions(scalesOptionHumidity);
    this.humiBarchartHourly.addConfigOptions(scalesOptionHumidity);

    this.cdRef.detectChanges();

    // 초기 데이터 로드 - 주석 해제하여 페이지 로드시 기본 데이터 표시
    this.updateMonthlyPage();
    this.updateDailyPage();
    this.updateHourlyPage();
  }

  updateMonthlyPage(): void {
    // 날짜 유효성 검사
    if (!this.startMonthlyDate || !this.endMonthlyDate) {
      console.warn('월별 날짜가 설정되지 않았습니다.');
      return;
    }

    // Chart Label
    this.chartMonthlyLabels = [];
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(
      this.endMonthlyDate,
      this.startMonthlyDate
    );

    // Table First Labels
    this.tempTableMonthlyLabels = [];
    this.tempTableMonthlyLabels.push('온도계');
    this.tempTableMonthlyLabels = this.tempTableMonthlyLabels.concat(
      this.chartMonthlyLabels
    );

    this.humiTableMonthlyLabels = [];
    this.humiTableMonthlyLabels.push('습도계');
    this.humiTableMonthlyLabels = this.humiTableMonthlyLabels.concat(
      this.chartMonthlyLabels
    );

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getTempCheckerCount();
    // Empty dataset
    this.tempBarchartMonthly?.resetDataset();
    this.humiBarchartMonthly?.resetDataset();

    this.semsService
      .getWeatherSummary(
        'MONTHLY',
        format(this.startMonthlyDate, 'yyyy-MM-dd'),
        format(this.endMonthlyDate, 'yyyy-MM-dd')
      )
      .subscribe(
        (res) => {
          const apiData = res;
          const tempApiData = [];
          const humidityApiData = [];

          for (let i = 0; i < apiData.length; i++) {
            if (apiData[i].insName.includes('AirTemp')) {
              tempApiData.push(apiData[i]);
            } else if (apiData[i].insName.includes('Humidity')) {
              humidityApiData.push(apiData[i]);
            }
          }

          this.tempTableMonthlyData = this.onTestUtil.syncWeatherGridData(
            this.chartMonthlyLabels,
            tempApiData,
            'temperature',
            this.tempBarchartMonthly,
            'yy-MM',
            undefined,
            undefined,
            this.site
          );
          this.humiTableMonthlyData = this.onTestUtil.syncWeatherGridData(
            this.chartMonthlyLabels,
            humidityApiData,
            'humidity',
            this.humiBarchartMonthly,
            'yy-MM',
            undefined,
            undefined,
            this.site
          );
        },
        (error) => {
          console.error('월별 데이터 조회 중 오류 발생:', error);
        }
      );
  }

  updateDailyPage(): void {
    // 날짜 유효성 검사
    if (!this.startDailyDate || !this.endDailyDate) {
      console.warn('일별 날짜가 설정되지 않았습니다.');
      return;
    }

    // Chart Label
    this.chartDailyLabels = [];
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(
      this.startDailyDate,
      this.endDailyDate
    );

    // Table First Labels
    this.tempTableDailyLabels = [];
    this.tempTableDailyLabels.push('온도계');
    this.tempTableDailyLabels = this.tempTableDailyLabels.concat(
      this.chartDailyLabels
    );

    this.humiTableDailyLabels = [];
    this.humiTableDailyLabels.push('습도계');
    this.humiTableDailyLabels = this.humiTableDailyLabels.concat(
      this.chartDailyLabels
    );

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.tempBarchartDaily?.resetDataset();
    this.humiBarchartDaily?.resetDataset();

    this.semsService
      .getWeatherSummary(
        'DAILY',
        format(this.startDailyDate, 'yyyy-MM-dd'),
        format(this.endDailyDate, 'yyyy-MM-dd')
      )
      .subscribe(
        (res) => {
          const apiData = res;
          const tempApiData = [];
          const humidityApiData = [];

          for (let i = 0; i < apiData.length; i++) {
            if (apiData[i].insName.includes('AirTemp')) {
              tempApiData.push(apiData[i]);
            } else if (apiData[i].insName.includes('Humidity')) {
              humidityApiData.push(apiData[i]);
            }
          }

          this.tempTableDailyData = this.onTestUtil.syncWeatherGridData(
            this.chartDailyLabels,
            tempApiData,
            'temperature',
            this.tempBarchartDaily,
            'MM-dd',
            undefined,
            undefined,
            this.site
          );
          this.humiTableDailyData = this.onTestUtil.syncWeatherGridData(
            this.chartDailyLabels,
            humidityApiData,
            'humidity',
            this.humiBarchartDaily,
            'MM-dd',
            undefined,
            undefined,
            this.site
          );
        },
        (error) => {
          console.error('일별 데이터 조회 중 오류 발생:', error);
        }
      );
  }

  updateHourlyPage(): void {
    console.log('🚀 updateHourlyPage 시작 - timeDate:', this.timeDate);

    // 날짜 유효성 검사
    if (!this.timeDate) {
      console.warn('시간별 날짜가 설정되지 않았습니다.');
      return;
    }

    // Chart Label
    this.chartTimeLabels = [];
    this.chartTimeLabels = DateUtils.getSpanTimeStringArray();

    // Table First Labels
    this.tempTableTimeLabels = [];
    this.tempTableTimeLabels.push('온도계');
    this.tempTableTimeLabels = this.tempTableTimeLabels.concat(
      this.chartTimeLabels
    );

    this.humiTableTimeLabels = [];
    this.humiTableTimeLabels.push('습도계');
    this.humiTableTimeLabels = this.humiTableTimeLabels.concat(
      this.chartTimeLabels
    );

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getSolarCheckerCount();
    // Empty dataset
    this.tempBarchartHourly?.resetDataset();
    this.humiBarchartHourly?.resetDataset();

    // 날짜 계산 수정 - 원본 객체를 변경하지 않도록 새 객체 생성
    const startDate = new Date(this.timeDate);
    const endDate = new Date(this.timeDate);
    endDate.setDate(endDate.getDate() + 1);

    console.log('📊 API 호출 파라미터:');
    console.log('- startDate:', format(startDate, 'yyyy-MM-dd'));
    console.log('- endDate:', format(endDate, 'yyyy-MM-dd'));
    console.log(
      '- 전체 URL:',
      `https://on-energy.kr/public/api/v1/weather/history/summary?summaryType=HOURLY&startDate=${format(
        startDate,
        'yyyy-MM-dd'
      )}&endDate=${format(endDate, 'yyyy-MM-dd')}`
    );

    this.semsService
      .getWeatherSummary(
        'HOURLY',
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      )
      .subscribe(
        (res) => {
          console.log('✅ API 응답 받음:', res);

          const apiData = res;
          const tempApiData = [];
          const humidityApiData = [];

          for (let i = 0; i < apiData.length; i++) {
            if (apiData[i].insName.includes('AirTemp')) {
              tempApiData.push(apiData[i]);
            } else if (apiData[i].insName.includes('Humidity')) {
              humidityApiData.push(apiData[i]);
            }
          }

          this.tempTableTimeData = this.onTestUtil.syncWeatherGridData(
            this.chartTimeLabels,
            tempApiData,
            'temperature',
            this.tempBarchartHourly,
            'HH',
            'hourly',
            undefined,
            this.site
          );

          this.humiTableTimeData = this.onTestUtil.syncWeatherGridData(
            this.chartTimeLabels,
            humidityApiData,
            'humidity',
            this.humiBarchartHourly,
            'HH',
            'hourly',
            undefined,
            this.site
          );
        },
        (error) => {
          console.error('❌ 시간별 데이터 조회 중 오류 발생:', error);
        }
      );
  }

  ngOnChanges(changes: SimpleChanges) {}

  // Monthly ------------------------------------------------------
  onStartMonthlyYearSelected(normalizedYear: Moment) {
    this.startMonthlyDate.setFullYear(normalizedYear.year());
  }

  onStartMonthlyMonthSelected(
    selectedDate: any,
    datepicker: MatDatepicker<Date>
  ) {
    console.log('🔍 월별 시작날짜 선택:', selectedDate);

    let normalizedMonth: Moment;
    if (selectedDate && typeof selectedDate.year === 'function') {
      // 이미 Moment 객체인 경우
      normalizedMonth = selectedDate;
    } else if (selectedDate instanceof Date) {
      // Date 객체인 경우 Moment로 변환
      normalizedMonth = moment(selectedDate);
    } else {
      console.error('❌ 지원하지 않는 날짜 형식:', selectedDate);
      return;
    }

    this.startMonthlyDate.setFullYear(normalizedMonth.year());
    this.startMonthlyDate.setMonth(normalizedMonth.month());
    this.startMonthlyDate = new Date(this.startMonthlyDate);

    console.log('📅 설정된 startMonthlyDate:', this.startMonthlyDate);

    datepicker.close();

    // 시작 날짜 변경 시 자동 조회
    setTimeout(() => {
      this.updateMonthlyPage();
    }, 100);
  }

  onEndMonthlyYearSelected(normalizedYear: Moment) {
    this.endMonthlyDate.setFullYear(normalizedYear.year());
  }

  onEndMonthlyMonthSelected(
    selectedDate: any,
    datepicker: MatDatepicker<Date>
  ) {
    console.log('🔍 월별 종료날짜 선택:', selectedDate);

    let normalizedMonth: Moment;
    if (selectedDate && typeof selectedDate.year === 'function') {
      // 이미 Moment 객체인 경우
      normalizedMonth = selectedDate;
    } else if (selectedDate instanceof Date) {
      // Date 객체인 경우 Moment로 변환
      normalizedMonth = moment(selectedDate);
    } else {
      console.error('❌ 지원하지 않는 날짜 형식:', selectedDate);
      return;
    }

    this.endMonthlyDate = normalizedMonth.endOf('month').toDate();
    console.log('📅 설정된 endMonthlyDate:', this.endMonthlyDate);

    datepicker.close();

    // 끝 날짜 변경 시 자동 조회
    setTimeout(() => {
      this.updateMonthlyPage();
    }, 100);
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(selectedDate: any) {
    console.log('🔍 일별 시작날짜 선택:', selectedDate);

    let newDate: Date;
    if (selectedDate && typeof selectedDate.toDate === 'function') {
      newDate = selectedDate.toDate();
    } else if (selectedDate instanceof Date) {
      newDate = selectedDate;
    } else if (typeof selectedDate === 'string') {
      newDate = new Date(selectedDate);
    } else {
      console.error('❌ 지원하지 않는 날짜 형식:', selectedDate);
      return;
    }

    this.startDailyDate = newDate;
    console.log('📅 설정된 startDailyDate:', this.startDailyDate);

    // 시작 날짜 변경 시 자동 조회
    setTimeout(() => {
      this.updateDailyPage();
    }, 100);
  }

  onEndDailyDaySelected(selectedDate: any) {
    console.log('🔍 일별 종료날짜 선택:', selectedDate);

    let newDate: Date;
    if (selectedDate && typeof selectedDate.toDate === 'function') {
      newDate = selectedDate.toDate();
    } else if (selectedDate instanceof Date) {
      newDate = selectedDate;
    } else if (typeof selectedDate === 'string') {
      newDate = new Date(selectedDate);
    } else {
      console.error('❌ 지원하지 않는 날짜 형식:', selectedDate);
      return;
    }

    this.endDailyDate = newDate;
    console.log('📅 설정된 endDailyDate:', this.endDailyDate);

    // 끝 날짜 변경 시 자동 조회
    setTimeout(() => {
      this.updateDailyPage();
    }, 100);
  }

  // Time ------------------------------------------------------------
  onHourlyDateSelected(selectedDate: any) {
    console.log('🔍 선택된 날짜 원본:', selectedDate);
    console.log('🔍 선택된 날짜 타입:', typeof selectedDate);

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

    console.log('📅 변환된 날짜:', newDate);
    this.timeDate = newDate;
    console.log('📅 설정된 timeDate:', this.timeDate);

    // 날짜 변경 시 자동 조회
    setTimeout(() => {
      console.log('⏰ updateHourlyPage 호출 시점의 timeDate:', this.timeDate);
      this.updateHourlyPage();
    }, 100);
  }
}
