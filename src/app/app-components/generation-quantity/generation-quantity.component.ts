import {
  Component,
  OnInit,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  AfterContentChecked,
  ChangeDetectorRef,
} from '@angular/core';

import { MatDatepicker } from '@angular/material/datepicker';
import moment, { Moment } from 'moment';
import 'moment/locale/ko'; //

// Services
import { SemsService } from '../../services/sems-service';
import { DateAdapter } from '@angular/material/core';

// Components
import { BarChartComponent } from '../../ui-components/bar-chart/bar-chart.component';

// Utils
import { ChartJsUtils } from '../../utils/chartjs-utils';
import { InvertorSummary } from 'src/app/models/invertor-summary';
import { OntestUtils } from 'src/app/utils/ontest-utils';

// RxJS
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-generation-quantity',
  templateUrl: './generation-quantity.component.html',
  styleUrls: ['./generation-quantity.component.scss'],
})
export class GenerationQuantityComponent
  implements OnInit, AfterViewInit, AfterContentChecked
{
  @ViewChild('barchartMonthly') barchartMonthly!: BarChartComponent;
  @ViewChild('barchartDaily') barchartDaily!: BarChartComponent;
  @ViewChild('barchartHourly') barchartHourly!: BarChartComponent;

  private chartUtil: ChartJsUtils = new ChartJsUtils();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  monthlyLegend: { label: string; color: string }[] = [];
  dailyLegend: { label: string; color: string }[] = [];
  hourlyLegend: { label: string; color: string }[] = [];

  isLoadingMonthly = false;
  isLoadingDaily = false;
  isLoadingHourly = false;

  showChart = true;
  viewChart = (show: boolean) => (this.showChart = !!show);

  startMonthlyDate: Date = new Date();
  startMinMonthlyDate!: Date;
  startMaxMonthlyDate!: Date;
  endMonthlyDate: Date = new Date();
  endMinMonthlyDate!: Date;
  endMaxMonthlyDate!: Date;
  chartMonthlyLabels!: string[];
  tableMonthlyLabels!: string[];
  tableMonthlyData!: InvertorSummary[];

  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate!: Date;
  endMaxDailyDate!: Date;
  chartDailyLabels!: string[];
  tableDailyLabels!: string[];
  tableDailyData!: InvertorSummary[];

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
    moment.locale('ko'); // ✅ set locale globally

    this.startMinMonthlyDate = this.semsService.getInstalledDate();
    this.startMaxMonthlyDate = new Date();
    this.endMinMonthlyDate = this.startMinMonthlyDate;
    this.endMaxMonthlyDate = this.startMaxMonthlyDate;

    this.startMonthlyDate = moment(this.startMaxMonthlyDate)
      .startOf('year')
      .toDate();
    this.endMonthlyDate = moment(this.startMaxMonthlyDate)
      .endOf('month')
      .toDate();

    this.startMinDailyDate = this.endMinDailyDate =
      this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = new Date();

    this.endDailyDate = moment().endOf('day').toDate();
    this.startDailyDate = moment(this.endDailyDate)
      .add(-29, 'days')
      .startOf('day')
      .toDate();

    this.timeDate = new Date();
    this.minTimeDate = this.semsService.getInstalledDate();
    this.maxTimeDate = new Date();
  }

  ngOnInit(): void {
    this.semsService.getSite().subscribe((res) => (this.site = res));
  }

  ngAfterContentChecked(): void {}

  ngAfterViewInit(): void {
    const baseChartOpts = {
      responsive: true,
      maintainAspectRatio: false,
      resizeDelay: 50,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          id: 'y',
          type: 'linear',
          title: { text: '발전량 W', display: true, align: 'end' },
          display: true,
          position: 'left',
        },
      },
    };

    this.barchartMonthly.addConfigOptions(baseChartOpts);
    this.barchartDaily.addConfigOptions(baseChartOpts);
    this.barchartHourly.addConfigOptions(baseChartOpts);

    this.cdRef.detectChanges();
    this.updateMonthlyPage();
    this.updateDailyPage();
    this.updateHourlyPage();
  }

  private toMoment(
    d: Date | Moment | string | null | undefined
  ): moment.Moment {
    return moment(d instanceof Date ? d : (d as any));
  }

  private normalizeDailyBounds(): void {
    const s = this.toMoment(this.startDailyDate).startOf('day');
    const e = this.toMoment(this.endDailyDate).endOf('day');
    this.startDailyDate = (
      s.isAfter(e) ? e.clone().startOf('day') : s
    ).toDate();
    this.endDailyDate = (s.isAfter(e) ? e : e).toDate();
  }

  private normalizeMonthlyBounds(): void {
    const s = this.toMoment(this.startMonthlyDate).startOf('month');
    const e = this.toMoment(this.endMonthlyDate).endOf('month');
    this.startMonthlyDate = (
      s.isAfter(e) ? e.clone().startOf('month') : s
    ).toDate();
    this.endMonthlyDate = (s.isAfter(e) ? e : e).toDate();
  }

  /**  Korean format for chart labels */
  private buildMonthLabels(start: Date, end: Date): string[] {
    const s = moment(start).startOf('month');
    const e = moment(end).endOf('month');
    const labels: string[] = [];
    const cur = s.clone();
    while (cur.isSameOrBefore(e, 'month')) {
      labels.push(cur.format('YYYY-MM'));
      cur.add(1, 'month');
    }
    return labels;
  }

  private buildDayLabels(start: Date, end: Date): string[] {
    const s = moment(start).startOf('day');
    const e = moment(end).endOf('day');
    const labels: string[] = [];
    const cur = s.clone();
    while (cur.isSameOrBefore(e, 'day')) {
      labels.push(cur.format('MM-DD'));
      cur.add(1, 'day');
    }
    return labels;
  }

  private applyDistinctColors(
    chartCmp: BarChartComponent,
    legendTarget?: any[]
  ): void {
    const chart: any = (chartCmp as any)?.chart || null;
    if (!chart?.data?.datasets) return;

    const GOLDEN_ANGLE = 137.508;
    const colorAt = (i: number) => `hsl(${(i * GOLDEN_ANGLE) % 360} 70% 50%)`;

    if (legendTarget) legendTarget.length = 0;

    chart.data.datasets.forEach((ds: any, idx: number) => {
      const c = colorAt(idx);
      ds.backgroundColor = c;
      ds.borderColor = c;
      if (legendTarget) legendTarget.push({ label: ds.label, color: c });
    });

    if (typeof chart.update === 'function') chart.update('none');
  }

  updateMonthlyPage(): void {
    this.normalizeMonthlyBounds();
    this.chartMonthlyLabels = this.buildMonthLabels(
      this.startMonthlyDate,
      this.endMonthlyDate
    );
    this.tableMonthlyLabels = ['인버터', ...this.chartMonthlyLabels];
    this.barchartMonthly.resetDataset();

    this.isLoadingMonthly = true;
    this.semsService
      .getGenerationQuantityMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .pipe(finalize(() => (this.isLoadingMonthly = false)))
      .subscribe((res) => {
        const apiData = res;
        this.tableMonthlyData = this.onTestUtil.syncGenerationGridData(
          this.chartMonthlyLabels.map((l) =>
            moment(l, 'YYYY년 MM월').format('YYYY-MM')
          ), // map back for API keys
          apiData,
          'powerAvg',
          this.barchartMonthly,
          'yyyy-MM',
          undefined,
          undefined,
          this.site
        );
        this.applyDistinctColors(this.barchartMonthly, this.monthlyLegend);
      });
  }

  updateDailyPage(): void {
    this.normalizeDailyBounds();
    this.chartDailyLabels = this.buildDayLabels(
      this.startDailyDate,
      this.endDailyDate
    );
    this.tableDailyLabels = ['인버터', ...this.chartDailyLabels];
    this.barchartDaily.resetDataset();

    this.isLoadingDaily = true;
    this.semsService
      .getGenerationQuantityDaily(this.startDailyDate, this.endDailyDate)
      .pipe(finalize(() => (this.isLoadingDaily = false)))
      .subscribe((res) => {
        const apiData = res;
        this.tableDailyData = this.onTestUtil.syncGenerationGridData(
          this.chartDailyLabels.map((l) =>
            moment(l, 'MM월 DD일').format('YYYY-MM-DD')
          ), // map back for API keys
          apiData,
          'powerAvg',
          this.barchartDaily,
          'yyyy-MM-dd',
          undefined,
          undefined,
          this.site
        );
        this.applyDistinctColors(this.barchartDaily, this.dailyLegend);
      });
  }

  updateHourlyPage(): void {
    // 00..23 numeric only
    this.chartTimeLabels = Array.from({ length: 24 }, (_, i) =>
      String(i).padStart(2, '0')
    );
    this.tableTimeLabels = ['인버터', ...this.chartTimeLabels];
    this.barchartHourly.resetDataset();

    this.isLoadingHourly = true;
    this.semsService
      .getGenerationQuantityHourly(
        this.toMoment(this.timeDate).startOf('day').toDate()
      )
      .pipe(finalize(() => (this.isLoadingHourly = false)))
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
        this.applyDistinctColors(this.barchartHourly, this.hourlyLegend);
      });
  }
  ngOnChanges(changes: SimpleChanges) {}

  // Date pickers unchanged
  onStartMonthlyYearSelected(y: Date | Moment) {
    const base = this.toMoment(this.startMonthlyDate);
    const year = this.toMoment(y).year();
    this.startMonthlyDate = base.year(year).startOf('month').toDate();
  }
  onStartMonthlyMonthSelected(
    m: Date | Moment,
    datepicker: MatDatepicker<Date>
  ) {
    this.startMonthlyDate = this.toMoment(m).startOf('month').toDate();
    datepicker.close();
  }
  onEndMonthlyYearSelected(y: Date | Moment) {
    const base = this.toMoment(this.endMonthlyDate);
    const year = this.toMoment(y).year();
    this.endMonthlyDate = base.year(year).endOf('month').toDate();
  }
  onEndMonthlyMonthSelected(m: Date | Moment, datepicker: MatDatepicker<Date>) {
    this.endMonthlyDate = this.toMoment(m).endOf('month').toDate();
    datepicker.close();
  }
  onStartDailyDaySelected(d: Date | Moment) {
    this.startDailyDate = this.toMoment(d).startOf('day').toDate();
  }
  onEndDailyDaySelected(d: Date | Moment) {
    this.endDailyDate = this.toMoment(d).endOf('day').toDate();
  }
  onHourlyDateSelected(d: Date | Moment) {
    this.timeDate = this.toMoment(d).startOf('day').toDate();
  }
}
