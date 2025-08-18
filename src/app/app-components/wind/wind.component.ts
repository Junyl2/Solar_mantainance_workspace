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
import { WeatherInfoSummary } from 'src/app/models/weather-info-summary';
import { format } from 'date-fns';
import { OntestUtils } from 'src/app/utils/ontest-utils';

@Component({
  selector: 'app-wind',
  templateUrl: './wind.component.html',
  styleUrls: ['./wind.component.scss'],
  providers: [],
})
export class WindComponent
  implements OnInit, AfterViewInit, AfterContentChecked
{
  @ViewChild('windDirectionBarchartMonthly')
  windDirectionBarchartMonthly!: BarChartComponent;
  @ViewChild('windDirectionBarchartDaily')
  windDirectionBarchartDaily!: BarChartComponent;
  @ViewChild('windDirectionBarchartHourly')
  windDirectionBarchartHourly!: BarChartComponent;

  @ViewChild('windSpeedBarchartMonthly')
  windSpeedBarchartMonthly!: BarChartComponent;
  @ViewChild('windSpeedBarchartDaily')
  windSpeedBarchartDaily!: BarChartComponent;
  @ViewChild('windSpeedBarchartHourly')
  windSpeedBarchartHourly!: BarChartComponent;

  // Utils
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  pickerStartDate = new Date(2022, 0, 1);
  showChart = true;

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
  windDirectionTableMonthlyLabels!: string[];
  windSpeedTableMonthlyLabels!: string[];
  windDirectionTableMonthlyData!: WeatherInfoSummary[];
  windSpeedTableMonthlyData!: WeatherInfoSummary[];

  // Daily -------------------------
  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate!: Date;
  endMaxDailyDate!: Date;
  chartDailyLabels!: string[];
  windDirectionTableDailyLabels!: string[];
  windSpeedTableDailyLabels!: string[];
  windDirectionTableDailyData!: WeatherInfoSummary[];
  windSpeedTableDailyData!: WeatherInfoSummary[];

  // Hourly --------------------------
  timeDate: Date = new Date();
  minTimeDate!: Date;
  maxTimeDate!: Date;
  chartTimeLabels!: string[];
  windDirectionTableTimeLabels!: string[];
  windSpeedTableTimeLabels!: string[];
  windDirectionTableTimeData!: WeatherInfoSummary[];
  windSpeedTableTimeData!: WeatherInfoSummary[];

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
            text: '풍향',
            display: true,
            align: 'end',
          },
          display: true,
          position: 'left',
        },
      },
    };
    this.windDirectionBarchartMonthly.addConfigOptions(scalesOptionTemperature);
    this.windDirectionBarchartDaily.addConfigOptions(scalesOptionTemperature);
    this.windDirectionBarchartHourly.addConfigOptions(scalesOptionTemperature);

    // initialize scale on chart
    const scalesOptionHumidity = {
      scales: {
        y: {
          id: 'y',
          type: 'linear',
          title: {
            text: '풍속 m/sec',
            display: true,
            align: 'end',
          },
          display: true,
          position: 'left',
        },
      },
    };
    this.windSpeedBarchartMonthly.addConfigOptions(scalesOptionHumidity);
    this.windSpeedBarchartDaily.addConfigOptions(scalesOptionHumidity);
    this.windSpeedBarchartHourly.addConfigOptions(scalesOptionHumidity);

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
    this.windDirectionTableMonthlyLabels = [];
    this.windDirectionTableMonthlyLabels.push('풍향각');
    this.windDirectionTableMonthlyLabels =
      this.windDirectionTableMonthlyLabels.concat(this.chartMonthlyLabels);

    this.windSpeedTableMonthlyLabels = [];
    this.windSpeedTableMonthlyLabels.push('풍속');
    this.windSpeedTableMonthlyLabels = this.windSpeedTableMonthlyLabels.concat(
      this.chartMonthlyLabels
    );

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.windDirectionBarchartMonthly.resetDataset();
    this.windSpeedBarchartMonthly.resetDataset();

    this.semsService
      .getWeatherSummary(
        'MONTHLY',
        format(this.startMonthlyDate, 'yyyy-MM-dd'),
        format(this.endMonthlyDate, 'yyyy-MM-dd')
      )
      .subscribe((res) => {
        const apiData = res;
        const wdApiData = [];
        const wsApiData = [];

        for (let i = 0; i < apiData.length; i++) {
          if (apiData[i].insName.includes('WinDir')) {
            wdApiData.push(apiData[i]);
          } else if (apiData[i].insName.includes('WinSpeed')) {
            wsApiData.push(apiData[i]);
          }
        }

        this.windDirectionTableMonthlyData =
          this.onTestUtil.syncInvertorGridData(
            this.chartMonthlyLabels,
            wdApiData,
            'wd',
            this.windDirectionBarchartMonthly,
            'yy-MM',
            undefined,
            undefined,
            this.site
          );
        this.windSpeedTableMonthlyData = this.onTestUtil.syncInvertorGridData(
          this.chartMonthlyLabels,
          wsApiData,
          'ws',
          this.windSpeedBarchartMonthly,
          'yy-MM',
          undefined,
          undefined,
          this.site
        );
      });
    // END
  }

  updateDailyPage(): void {
    // Chart Label
    this.chartDailyLabels = [];
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(
      this.startDailyDate,
      this.endDailyDate
    );

    // Table First Labels
    this.windDirectionTableDailyLabels = [];
    this.windDirectionTableDailyLabels.push('풍향각');
    this.windDirectionTableDailyLabels =
      this.windDirectionTableDailyLabels.concat(this.chartDailyLabels);

    this.windSpeedTableDailyLabels = [];
    this.windSpeedTableDailyLabels.push('풍속');
    this.windSpeedTableDailyLabels = this.windSpeedTableDailyLabels.concat(
      this.chartDailyLabels
    );

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.windDirectionBarchartDaily.resetDataset();
    this.windSpeedBarchartDaily.resetDataset();

    this.semsService
      .getWeatherSummary(
        'DAILY',
        format(this.startDailyDate, 'yyyy-MM-dd'),
        format(this.endDailyDate, 'yyyy-MM-dd')
      )
      .subscribe((res) => {
        const apiData = res;
        const wdApiData = [];
        const wsApiData = [];

        for (let i = 0; i < apiData.length; i++) {
          if (apiData[i].insName.includes('WinDir')) {
            wdApiData.push(apiData[i]);
          } else if (apiData[i].insName.includes('WinSpeed')) {
            wsApiData.push(apiData[i]);
          }
        }

        this.windDirectionTableDailyData = this.onTestUtil.syncInvertorGridData(
          this.chartDailyLabels,
          wdApiData,
          'wd',
          this.windDirectionBarchartDaily,
          'MM-dd',
          undefined,
          undefined,
          this.site
        );
        this.windSpeedTableDailyData = this.onTestUtil.syncInvertorGridData(
          this.chartDailyLabels,
          wsApiData,
          'ws',
          this.windSpeedBarchartDaily,
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
    this.windDirectionTableTimeLabels = [];
    this.windDirectionTableTimeLabels.push('풍향각');
    this.windDirectionTableTimeLabels =
      this.windDirectionTableTimeLabels.concat(this.chartTimeLabels);

    this.windSpeedTableTimeLabels = [];
    this.windSpeedTableTimeLabels.push('풍속');
    this.windSpeedTableTimeLabels = this.windSpeedTableTimeLabels.concat(
      this.chartTimeLabels
    );

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getSolarCheckerCount();
    // Empty dataset
    this.windDirectionBarchartHourly.resetDataset();
    this.windSpeedBarchartHourly.resetDataset();

    let dateParam = new Date(this.timeDate);
    this.semsService
      .getWeatherSummary(
        'HOURLY',
        format(dateParam, 'yyyy-MM-dd'),
        format(dateParam.setDate(this.timeDate.getDate() + 1), 'yyyy-MM-dd')
      )
      .subscribe((res) => {
        const apiData = res;
        const wdApiData = [];
        const wsApiData = [];

        for (let i = 0; i < apiData.length; i++) {
          if (apiData[i].insName.includes('WinDir')) {
            wdApiData.push(apiData[i]);
          } else if (apiData[i].insName.includes('WinSpeed')) {
            wsApiData.push(apiData[i]);
          }
        }

        this.windDirectionTableTimeData = this.onTestUtil.syncInvertorGridData(
          this.chartTimeLabels,
          wdApiData,
          'wd',
          this.windDirectionBarchartHourly,
          'HH',
          'hourly',
          undefined,
          this.site
        );
        this.windSpeedTableTimeData = this.onTestUtil.syncInvertorGridData(
          this.chartTimeLabels,
          wsApiData,
          'ws',
          this.windSpeedBarchartHourly,
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
