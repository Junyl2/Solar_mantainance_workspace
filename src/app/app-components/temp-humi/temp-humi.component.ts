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

    // Monthly ---------------------------
    //this.updateMonthlyPage();

    // Daily -----------------------------
    //this.updateDailyPage();

    // Hours -----------------------------
    //this.updateHourlyPage();
  }

  updateMonthlyPage(): void {
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
    this.tempBarchartMonthly.resetDataset();
    this.humiBarchartMonthly.resetDataset();

    this.semsService
      .getWeatherSummary(
        'MONTHLY',
        format(this.startMonthlyDate, 'yyyy-MM-dd'),
        format(this.endMonthlyDate, 'yyyy-MM-dd')
      )
      .subscribe((res) => {
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
      });

    // END Temp
  }

  updateDailyPage(): void {
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
    this.tempBarchartDaily.resetDataset();
    this.humiBarchartDaily.resetDataset();

    this.semsService
      .getWeatherSummary(
        'DAILY',
        format(this.startDailyDate, 'yyyy-MM-dd'),
        format(this.endDailyDate, 'yyyy-MM-dd')
      )
      .subscribe((res) => {
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
      });
  }

  updateHourlyPage(): void {
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
    this.tempBarchartHourly.resetDataset();
    this.humiBarchartHourly.resetDataset();

    let dateParam = new Date(this.timeDate);
    this.semsService
      .getWeatherSummary(
        'HOURLY',
        format(dateParam, 'yyyy-MM-dd'),
        format(dateParam.setDate(this.timeDate.getDate() + 1), 'yyyy-MM-dd')
      )
      .subscribe((res) => {
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
          'temperature', // 'temp' → 'temperature'로 변경
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
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    this.startDailyDate = normalizedDate.toDate();
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.toDate();
  }

  // Time ------------------------------------------------------------

  onHourlyDateSelected(normalizedDate: Moment) {
    this.timeDate = normalizedDate.toDate();
  }
}
