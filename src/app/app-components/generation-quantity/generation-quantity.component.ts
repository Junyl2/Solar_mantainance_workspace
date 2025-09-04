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
import { InvertorSummary } from 'src/app/models/invertor-summary';
import { format } from 'date-fns';
import { OntestUtils } from 'src/app/utils/ontest-utils';

@Component({
  selector: 'app-generation-quantity',
  templateUrl: './generation-quantity.component.html',
  styleUrls: ['./generation-quantity.component.scss'],
  providers: [],
})
export class GenerationQuantityComponent
  implements OnInit, AfterViewInit, AfterContentChecked
{
  @ViewChild('barchartMonthly') barchartMonthly!: BarChartComponent;
  @ViewChild('barchartDaily') barchartDaily!: BarChartComponent;
  @ViewChild('barchartHourly') barchartHourly!: BarChartComponent;

  // Utils
  private chartUtil: ChartJsUtils = new ChartJsUtils();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  showChart = true;
  pickerStartDate = new Date('2021-10-01');

  viewChart = (show: boolean) => {
    this.showChart = !!show;
  };

  startYMat!: Date;
  endYMat!: Date;

  control = {
    name: 'monthly',
    value: new Date(),
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
    this.startMaxDailyDate =
      this.endMaxDailyDate =
      this.endDailyDate =
        moment().toDate();
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
    const scalesOption = {
      scales: {
        y: {
          id: 'y',
          type: 'linear',
          title: {
            text: '발전량 W',
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

  // === Distinct color helpers ===========================================

  /** Golden-angle HSL palette: generates visually distinct colors per index */
  private getDistinctColor(i: number): string {
    const GOLDEN_ANGLE = 137.508; // degrees
    const hue = (i * GOLDEN_ANGLE) % 360;
    // High saturation/medium lightness works on light/dark UIs
    return `hsl(${hue} 70% 50%)`;
  }

  /** Apply unique colors to all datasets of a BarChartComponent instance */
  private applyDistinctColors(chartCmp: BarChartComponent): void {
    // Attempt to access underlying Chart.js instance used by BarChartComponent
    const chart: any =
      (chartCmp as any)?.chart ||
      (chartCmp as any)?._chart ||
      (chartCmp as any)?.chartRef ||
      null;

    if (!chart?.data?.datasets) return;

    chart.data.datasets.forEach((ds: any, idx: number) => {
      const c = this.getDistinctColor(idx);
      // If dataset already has arrays, replace with solid color string
      ds.backgroundColor = c;
      ds.borderColor = c;
      ds.hoverBackgroundColor = c;
      ds.hoverBorderColor = c;
      ds.borderWidth = ds.borderWidth ?? 1;
    });

    if (typeof chart.update === 'function') {
      chart.update();
    }
  }

  // ======================================================================

  updateMonthlyPage(): void {
    // Chart Label
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(
      this.endMonthlyDate,
      this.startMonthlyDate
    );

    // Table First Labels
    this.tableMonthlyLabels = ['인버터', ...this.chartMonthlyLabels];

    // Chart Data & Table Data ---------------------------------------------
    this.barchartMonthly?.resetDataset();

    this.semsService
      .getGenerationQuantityMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .subscribe((res) => {
        const apiData = res;

        this.tableMonthlyData = this.onTestUtil.syncGenerationGridData(
          this.chartMonthlyLabels,
          apiData,
          'powerAvg',
          this.barchartMonthly,
          'yy-MM',
          undefined,
          undefined,
          this.site
        );

        // Ensure every inverter (dataset) gets a unique color
        this.applyDistinctColors(this.barchartMonthly);
      });
  }

  async updateDailyPage(): Promise<void> {
    // Chart Label
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(
      this.startDailyDate,
      this.endDailyDate
    );

    // Table First Labels
    this.tableDailyLabels = ['인버터', ...this.chartDailyLabels];

    // Chart Data & Table Data ---------------------------------------------
    this.barchartDaily.resetDataset();

    this.semsService
      .getGenerationQuantityDaily(this.startDailyDate, this.endDailyDate)
      .subscribe((res) => {
        const apiData = res;

        this.tableDailyData = this.onTestUtil.syncGenerationGridData(
          this.chartDailyLabels,
          apiData,
          'powerAvg',
          this.barchartDaily,
          'MM-dd',
          undefined,
          undefined,
          this.site
        );

        // Unique colors per dataset
        this.applyDistinctColors(this.barchartDaily);
      });
  }

  updateHourlyPage(): void {
    // Chart Label
    this.chartTimeLabels = DateUtils.getSpanTimeStringArray();

    // Table First Labels
    this.tableTimeLabels = ['인버터', ...this.chartTimeLabels];

    // Chart Data & Table Data ---------------------------------------------
    this.barchartHourly.resetDataset();

    this.semsService
      .getGenerationQuantityHourly(this.timeDate)
      .subscribe((res) => {
        const apiData = res;

        this.tableTimeData = this.onTestUtil.syncGenerationGridData(
          this.chartTimeLabels,
          apiData,
          'powerAvg',
          this.barchartHourly,
          'HH',
          'hourly',
          undefined,
          this.site
        );

        // Unique colors per dataset
        this.applyDistinctColors(this.barchartHourly);
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
