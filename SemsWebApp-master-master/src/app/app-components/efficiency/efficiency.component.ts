import { Component, OnInit, SimpleChanges, AfterViewInit, ViewChild, ElementRef, AfterContentChecked, ChangeDetectorRef } from '@angular/core';

// Angular Material Datepicker
import { MatDatepicker } from '@angular/material/datepicker';
import { Moment } from 'moment';
import moment from 'moment';

// Services
import { SemsService } from '../../services/sems-service';
import { DateAdapter, ThemePalette } from '@angular/material/core';

// Components
import { BarChartComponent } from '../../ui-components/bar-chart/bar-chart.component';

// Utils
import { DateUtils } from '../../utils/date-utils';
import { ChartJsUtils } from '../../utils/chartjs-utils';
import { InvertorSummary } from 'src/app/models/invertor-summary';
import { format, roundToNearestMinutes } from 'date-fns';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { OntestUtils } from 'src/app/utils/ontest-utils';


@Component({
  selector: 'app-efficiency',
  templateUrl: './efficiency.component.html',
  styleUrls: ['./efficiency.component.scss'],
  providers: [
  ],
})
export class EfficiencyComponent implements OnInit, AfterViewInit, AfterContentChecked {

  @ViewChild('barchartMonthly') barchartMonthly!: BarChartComponent;
  @ViewChild('barchartDaily') barchartDaily!: BarChartComponent;
  @ViewChild('barchartHourly') barchartHourly!: BarChartComponent;
  @ViewChild('picker') picker: any;

  // Utils
  private chartUtil: ChartJsUtils = new ChartJsUtils();
  private ontestUtil: OntestUtils = new OntestUtils(this.semsService);

  showChart = true;

  viewChart = (show: boolean) => {
    if (show) {
      this.showChart = true;
    } else {
      this.showChart = false;
    }
  }

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
  tableMonthlyLabels!: string[];
  tableMonthlyData!: InvertorSummary[];

  // Daily -------------------------
  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate!: Date;
  endMaxDailyDate!: Date;
  chartDailyLabels!: string[];
  tableDailyLabels!: string[];
  tableDailyData!: InvertorSummary[];

  // Hourly --------------------------
  timeDate: Date = new Date();
  minTimeDate!: Date;
  maxTimeDate!: Date;
  chartTimeLabels!: string[];
  tableTimeLabels!: string[];
  tableTimeData!: InvertorSummary[];

  // Datetime picker --------
  public date: moment.Moment;
  public disabled = false;
  public showSpinners = true;
  public showSeconds = false;
  public touchUi = false;
  public enableMeridian = false;
  public minDate: Date;
  public maxDate: Date;
  public stepHour = 1;
  public stepMinute = 10;
  public color: ThemePalette = 'primary';

  isOpen = false;

  public roundDate = roundToNearestMinutes(new Date('2021-10-07 16:10:00'), { nearestTo: 10 });

  public dateControl = new FormControl(this.roundDate);
  public dateControlMinMax = new FormControl(new Date());

  updateDCData = () => {
    const param = new Date(this.dateControl.value).toISOString();
    console.log(param);

    this.semsService.getInvertorDataByDatetime(param)
      .subscribe((res) => {
        console.log(res);
      })
  }

  public options = [
    { value: true, label: 'True' },
    { value: false, label: 'False' }
  ];

  public listColors = ['primary', 'accent', 'warn'];
  site: {};

  constructor(private semsService: SemsService,
    private dateAdapter: DateAdapter<any>,
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private router: Router,
  ) {

    // Monthly ----------------------
    this.startMinMonthlyDate = this.semsService.getInstalledDate();
    this.startMaxMonthlyDate = moment().toDate();
    this.endMinMonthlyDate = this.startMinMonthlyDate;
    this.endMaxMonthlyDate = this.startMaxMonthlyDate;
    this.startMonthlyDate = this.startMinMonthlyDate;
    this.endMonthlyDate = moment().toDate();


    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate = this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();

    // Time ---------------------------
    this.timeDate = this.maxTimeDate = moment().toDate();
    this.minTimeDate = this.semsService.getInstalledDate();

    // Datepicker
    this.minDate = this.semsService.getInstalledDate();
    this.maxDate = new Date();
  }

  ngOnInit(): void {
    this.semsService.getSite().subscribe(res => {
      this.site = res;

      console.log(this.site);
    })
  }

  ngAfterContentChecked(): void {
  }

  ngAfterViewChecked(){
    this.cdRef.detectChanges();
  }

  ngAfterViewInit(): void {
    // initialize scale on chart
    const scalesOption = {
      scales: {
        y: {
          id: 'y',
          type: 'linear',
          title: {
            text: '인버터 %',
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
    this.updateMonthlyPage();

    // Daily -----------------------------
    this.updateDailyPage();

    // Hours -----------------------------
    this.updateHourlyPage();
  }

  updateMonthlyPage(): void {
    // Chart Label
    this.chartMonthlyLabels = [];
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(this.endMonthlyDate, this.startMonthlyDate);
    var dataCount = this.chartMonthlyLabels.length;

    // Table First Labels
    this.tableMonthlyLabels = [];
    this.tableMonthlyLabels.push("인버터");
    this.tableMonthlyLabels = this.tableMonthlyLabels.concat(this.chartMonthlyLabels);

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getInverterCount();
    // Empty dataset
    this.barchartMonthly.resetDataset();

    this.semsService.getEfficiencyMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .subscribe(res => {
        const apiData = res;

        this.tableMonthlyData = this.ontestUtil.syncGenerationGridData(this.chartMonthlyLabels, apiData, 'efficiency', this.barchartMonthly, 'yy-MM', undefined, undefined, this.site)
      })
  }

  async updateDailyPage(): Promise<void> {
    // Chart Label
    this.chartDailyLabels = [];
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(this.startDailyDate, this.endDailyDate);

    // Table First Labels
    this.tableDailyLabels = [];
    this.tableDailyLabels.push("인버터");
    this.tableDailyLabels = this.tableDailyLabels.concat(this.chartDailyLabels);

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.barchartDaily.resetDataset();

    this.semsService.getEfficiencyDaily(this.startDailyDate, this.endDailyDate)
      .subscribe(res => {
        const apiData = res;

        this.tableDailyData = this.ontestUtil.syncGenerationGridData(this.chartDailyLabels, apiData, 'efficiency', this.barchartDaily, 'MM-dd', undefined, undefined, this.site)
      })
  }

  updateHourlyPage(): void {
    // Chart Label
    this.chartTimeLabels = [];
    this.chartTimeLabels = DateUtils.getSpanTimeStringArray();

    // Table First Labels
    this.tableTimeLabels = [];
    this.tableTimeLabels.push("인버터");
    this.tableTimeLabels = this.tableTimeLabels.concat(this.chartTimeLabels);

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getInverterCount();
    // Empty dataset
    this.barchartHourly.resetDataset();

    this.semsService.getEfficiencyHourly(this.timeDate)
      .subscribe(res => {
        const apiData = res;

        this.tableTimeData = this.ontestUtil.syncGenerationGridData(this.chartTimeLabels, apiData, 'efficiency', this.barchartHourly, 'HH', 'hourly', undefined, this.site)
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

  openDialog() {
    this.router.navigate(['/invertor/alarm']);
  }

}
