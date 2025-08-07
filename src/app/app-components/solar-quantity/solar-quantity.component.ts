import { Component, OnInit, SimpleChanges, AfterViewInit, ViewChild, ElementRef, AfterContentChecked, ChangeDetectorRef  } from '@angular/core';

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
  providers: [
  ],
})
export class SolarQuantityComponent implements OnInit, AfterViewInit, AfterContentChecked {

  @ViewChild('barchartMonthly') barchartMonthly! : BarChartComponent;
  @ViewChild('barchartDaily') barchartDaily! : BarChartComponent;
  @ViewChild('barchartHourly') barchartHourly! : BarChartComponent;

  // Utils
  private chartUtil : ChartJsUtils = new ChartJsUtils();
  private onTestUtil : OntestUtils = new OntestUtils(this.semsService);

  showChart:boolean = true;
  pickerStartDate = new Date(2022, 0, 1);

  startYMat!: Date;
  endYMat!: Date;

  viewChart = (show:boolean) => {
    if(show) {
      this.showChart = true;
    } else {
      this.showChart = false;
    }
  }

  // Monthly ----------------------
  startMonthlyDate: Date = new Date();
  startMinMonthlyDate!: Date;
  startMaxMonthlyDate!: Date;
  endMonthlyDate: Date = new Date();
  endMinMonthlyDate!: Date;
  endMaxMonthlyDate!: Date;
  chartMonthlyLabels!: string[];
  tableMonthlyLabels!: string[];
  tableMonthlyData! : WeatherInfoSummary[];

  // Daily -------------------------
  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate! : Date;
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

  constructor(private semsService: SemsService,
    private dateAdapter: DateAdapter<any>,
    private cdRef:ChangeDetectorRef) {

    // Monthly ----------------------
    this.startMinMonthlyDate = this.semsService.getInstalledDate();
    this.startMaxMonthlyDate = moment().toDate();
    this.endMinMonthlyDate = this.startMinMonthlyDate;
    this.endMaxMonthlyDate = this.startMaxMonthlyDate;
    this.startMonthlyDate = this.startMinMonthlyDate;
    this.endMonthlyDate = moment().toDate();


    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate = this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = moment().toDate();

    this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1,'M').toDate();


    // Time ---------------------------
    this.timeDate = this.maxTimeDate = moment().toDate();
    this.minTimeDate = this.semsService.getInstalledDate();
  }

  site;

  ngOnInit(): void {
    this.semsService.getSite().subscribe(res => {
      this.site = res;
    })
  }

  ngAfterContentChecked(): void {

  }

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
      }
    }
    this.barchartMonthly.addConfigOptions(scalesOption)
    this.barchartHourly.addConfigOptions(scalesOption)
    this.barchartDaily.addConfigOptions(scalesOption)

    this.cdRef.detectChanges();

    // Monthly ---------------------------
    //this.updateMonthlyPage();

    // Daily -----------------------------
    //this.updateDailyPage();

    // Hours -----------------------------
    //this.updateHourlyPage();
  }

  updateMonthlyPage() : void {
    // Chart Label
    this.chartMonthlyLabels = [];
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(this.endMonthlyDate, this.startMonthlyDate);

    // Table First Labels
    this.tableMonthlyLabels = [];
    this.tableMonthlyLabels.push("일사량계");
    this.tableMonthlyLabels= this.tableMonthlyLabels.concat(this.chartMonthlyLabels);

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getSolarCheckerCount();
    // Empty dataset
    this.barchartMonthly.resetDataset();

    this.semsService.getWeatherSummary("MONTHLY", format(this.startMonthlyDate, 'yyyy-MM-dd'), format(this.endMonthlyDate, 'yyyy-MM-dd'))
        .subscribe(res => {
      const apiData = res;
      const irApiData = [];

      for (let i = 0; i < apiData.length; i++) {
        if (apiData[i].insName.includes('Irradiance')) {
          irApiData.push(apiData[i]);
        }
      }

      this.tableMonthlyData = this.onTestUtil.syncInvertorGridData(this.chartMonthlyLabels, irApiData, "irradiance", this.barchartMonthly, 'yy-MM', undefined, undefined, this.site);
    })
  }

  updateDailyPage() : void {
    // Chart Label
    this.chartDailyLabels = [];
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(this.startDailyDate, this.endDailyDate);

    // Table First Labels
    this.tableDailyLabels = [];
    this.tableDailyLabels.push("일사량계");
    this.tableDailyLabels= this.tableDailyLabels.concat(this.chartDailyLabels);

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.barchartDaily.resetDataset();

    this.semsService.getWeatherSummary("DAILY", format(this.startDailyDate, 'yyyy-MM-dd'), format(this.endDailyDate, 'yyyy-MM-dd'))
        .subscribe(res => {
      const apiData = res;
      const irApiData = [];

      for (let i = 0; i < apiData.length; i++) {
        if (apiData[i].insName.includes('Irradiance')) {
          irApiData.push(apiData[i]);
        }
      }

      this.tableDailyData = this.onTestUtil.syncInvertorGridData(this.chartDailyLabels, irApiData, "irradiance", this.barchartDaily, 'MM-dd', undefined, undefined, this.site);
    })
  }

  updateHourlyPage() : void {
    // Chart Label
    this.chartTimeLabels = [];
    this.chartTimeLabels = DateUtils.getSpanTimeStringArray();

    // Table First Labels
    this.tableTimeLabels = [];
    this.tableTimeLabels.push("일사량계");
    this.tableTimeLabels= this.tableTimeLabels.concat(this.chartTimeLabels);

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getSolarCheckerCount();
    // Empty dataset
    this.barchartHourly.resetDataset();

    let dateParam = new Date(this.timeDate);
    this.semsService.getWeatherSummary("HOURLY", format(dateParam, 'yyyy-MM-dd'), format(dateParam.setDate(this.timeDate.getDate() + 1), 'yyyy-MM-dd'))
        .subscribe(res => {
      const apiData = res;
      const irApiData = [];

      for (let i = 0; i < apiData.length; i++) {
        if (apiData[i].insName.includes('Irradiance')) {
          irApiData.push(apiData[i]);
        }
      }

      this.tableTimeData = this.onTestUtil.syncInvertorGridData(this.chartTimeLabels, irApiData, "irradiance", this.barchartHourly, 'HH', 'hourly', undefined, this.site);
    })
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  // Monthly ------------------------------------------------------
  onStartMonthlyYearSelected(normalizedYear: Moment) {
    this.startMonthlyDate.setFullYear(normalizedYear.year());
  }
  onStartMonthlyMonthSelected(normalizedMonth: Moment, datepicker: MatDatepicker<Date>) {
    this.startMonthlyDate.setFullYear(normalizedMonth.year());
    this.startMonthlyDate.setMonth(normalizedMonth.month());
    this.startMonthlyDate = new Date(this.startMonthlyDate);

    datepicker.close();
  }

  onEndMonthlyYearSelected(normalizedYear: Moment) {
    this.endMonthlyDate.setFullYear(normalizedYear.year());
  }
  onEndMonthlyMonthSelected(normalizedMonth: Moment, datepicker: MatDatepicker<Date>) {
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
