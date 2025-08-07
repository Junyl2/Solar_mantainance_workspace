import { ChangeDetectorRef, Component, OnInit, SimpleChanges, ViewChild } from '@angular/core';



// Angular Material Datepicker
import { MatDatepicker, MatDatepickerInput, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Moment } from 'moment';

import moment from 'moment';

// Services
import { SemsService } from '../../services/sems-service';
import { DateAdapter } from '@angular/material/core';

// Utils
import { DateUtils } from '../../utils/date-utils';
import { BarChartComponent } from 'src/app/ui-components/bar-chart/bar-chart.component';
import { ChartJsUtils } from 'src/app/utils/chartjs-utils';
import { OntestUtils } from 'src/app/utils/ontest-utils';
import { InvertorSummary } from 'src/app/models/invertor-summary';


@Component({
  selector: 'app-solar-efficiency',
  templateUrl: './solar-efficiency.component.html',
  styleUrls: ['./solar-efficiency.component.scss'],
  providers: [
  ],
})
export class SolarEfficiencyComponent implements OnInit {
  @ViewChild('barchartMonthly') barchartMonthly! : BarChartComponent;
  @ViewChild('barchartDaily') barchartDaily! : BarChartComponent;
  @ViewChild('barchartHourly') barchartHourly! : BarChartComponent;

  // Utils
  private chartUtil : ChartJsUtils = new ChartJsUtils();
  private onTestUtil : OntestUtils = new OntestUtils(this.semsService);

  pickerStartDate = new Date('2021-10-01');
  showChart = true;

  viewChart = (show:boolean) => {
    if(show) {
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
  tableMonthlyData! : InvertorSummary[];

  // Daily -------------------------
  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate! : Date;
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
    this.startMaxDailyDate = this.endMaxDailyDate = this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();
    
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
            text: '복합차트',
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

  updateMonthlyPage() : void {
    // Chart Label    
    this.chartMonthlyLabels = [];
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(this.endMonthlyDate, this.startMonthlyDate);
    var dataCount = this.chartMonthlyLabels.length;
    
    // Table First Labels
    this.tableMonthlyLabels = [];
    this.tableMonthlyLabels.push("인버터");
    this.tableMonthlyLabels= this.tableMonthlyLabels.concat(this.chartMonthlyLabels);
    
    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getInverterCount();
    // Empty dataset
    this.barchartMonthly.resetDataset(); 

    this.semsService.getPowerIrradianceMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .subscribe(res => {
        const apiData = res;

        this.tableMonthlyData = this.onTestUtil.syncGenerationGridData(this.chartMonthlyLabels, apiData, 'powerIrradiance', this.barchartMonthly, 'yy-MM', undefined, undefined, this.site);
      })
  }

  async updateDailyPage() : Promise<void> {
    // Chart Label
    this.chartDailyLabels = [];
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(this.startDailyDate, this.endDailyDate);

    // Table First Labels
    this.tableDailyLabels = [];
    this.tableDailyLabels.push("인버터");
    this.tableDailyLabels= this.tableDailyLabels.concat(this.chartDailyLabels);

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.barchartDaily.resetDataset(); 

    this.semsService.getPowerIrradianceDaily(this.startDailyDate, this.endDailyDate)
      .subscribe(res => {
        const apiData = res;

        this.tableDailyData = this.onTestUtil.syncGenerationGridData(this.chartDailyLabels, apiData, 'powerIrradiance', this.barchartDaily, 'MM-dd', undefined, undefined, this.site);
      })
  }

  updateHourlyPage() : void {
    // Chart Label 
    this.chartTimeLabels = [];
    this.chartTimeLabels = DateUtils.getSpanTimeStringArray();

    // Table First Labels
    this.tableTimeLabels = [];
    this.tableTimeLabels.push("인버터");
    this.tableTimeLabels= this.tableTimeLabels.concat(this.chartTimeLabels);

    // Chart Data & Table Data ---------------------------------------------
    var inverterCount = this.semsService.getInverterCount();
    // Empty dataset
    this.barchartHourly.resetDataset(); 

    this.semsService.getPowerIrradianceHourly(this.timeDate)
      .subscribe(res => {
        const apiData = res;

        this.tableTimeData = this.onTestUtil.syncGenerationGridData(this.chartTimeLabels, apiData, 'powerIrradiance', this.barchartHourly, 'HH', 'hourly', undefined, this.site);
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
