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
import { Router } from '@angular/router';
import { OntestUtils } from 'src/app/utils/ontest-utils';

@Component({
  selector: 'app-efficiency',
  templateUrl: './efficiency.component.html',
  styleUrls: ['./efficiency.component.scss'],
  providers: [],
})
export class EfficiencyComponent
  implements OnInit, AfterViewInit, AfterContentChecked
{
  @ViewChild('barchartMonthly') barchartMonthly!: BarChartComponent;
  @ViewChild('barchartDaily') barchartDaily!: BarChartComponent;
  @ViewChild('barchartHourly') barchartHourly!: BarChartComponent;
  @ViewChild('picker') picker: any;

  // Utils
  private chartUtil: ChartJsUtils = new ChartJsUtils();
  private ontestUtil: OntestUtils = new OntestUtils(this.semsService);

  showChart = true;

  viewChart = (show: boolean) => {
    this.showChart = !!show;
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

  public roundDate = roundToNearestMinutes(new Date('2021-10-07 16:10:00'), {
    nearestTo: 10,
  });

  public dateControl = new FormControl(this.roundDate);
  public dateControlMinMax = new FormControl(new Date());

  updateDCData = () => {
    const param = new Date(this.dateControl.value as Date).toISOString();
    console.log(param);

    this.semsService.getInvertorDataByDatetime(param).subscribe((res) => {
      console.log(res);
    });
  };

  public options = [
    { value: true, label: 'True' },
    { value: false, label: 'False' },
  ];

  public listColors = ['primary', 'accent', 'warn'];
  site: {};

  constructor(
    private semsService: SemsService,
    private dateAdapter: DateAdapter<any>,
    private cdRef: ChangeDetectorRef,
    public dialog: MatDialog,
    private router: Router
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

    // Datepicker
    this.minDate = this.semsService.getInstalledDate();
    this.maxDate = new Date();
  }

  ngOnInit(): void {
    this.semsService.getSite().subscribe((res) => {
      this.site = res;
      console.log(this.site);
    });
  }

  ngAfterContentChecked(): void {}

  ngAfterViewChecked() {
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

  /** -------- LABEL NORMALIZATION (203 ONLY) -------- */
  /** Maps any raw name that contains "203" into Korean "203 인버터" */
  private getDisplayName(raw: string | undefined | null): string {
    if (!raw) return '';
    return raw.includes('203') ? '203 인버터' : raw;
  }

  /** Overwrite dataset legend labels on a BarChartComponent, if accessible. */
  private normalizeChartLegendLabels(chartRef: BarChartComponent) {
    try {
      // Support both Chart.js instance access or wrapper data access
      const chart: any = (chartRef as any)?.chart || (chartRef as any)?._chart;
      const datasets: any[] =
        chart?.data?.datasets || (chartRef as any)?.datasets || [];

      if (Array.isArray(datasets)) {
        datasets.forEach((ds) => {
          if (typeof ds?.label === 'string') {
            ds.label = this.getDisplayName(ds.label);
          }
        });
      }

      // Trigger chart update if available
      if (chart?.update) chart.update();
      else if ((chartRef as any)?.update) (chartRef as any).update();
    } catch (e) {
      // Non-fatal: if BarChartComponent doesn't expose internals, skip
      console.warn('Could not normalize chart legend labels:', e);
    }
  }

  /** Add displayName to table rows (used by template) */
  private attachDisplayNames<T extends { insName?: string; name?: string }>(
    rows: T[]
  ): (T & { displayName: string })[] {
    return (rows || []).map((r) => ({
      ...(r as any),
      displayName: this.getDisplayName(r.insName || r.name || ''),
    }));
  }

  /** (Optional) Normalize API payload before chart/table sync */
  private normalizeApiPayload(apiData: any[]): any[] {
    // If backend sometimes sends noisy strings like "[203]IVERFTER[203]",
    // sanitize those *before* they are converted to datasets/rows.
    return (apiData || []).map((item) => {
      const raw = item?.insName || item?.name || '';
      const normalized = this.getDisplayName(raw);
      return {
        ...item,
        // keep original fields but ensure name/insName are clean for legend use
        insName: normalized.includes('203 인버터')
          ? '203 인버터'
          : item.insName,
        name: normalized.includes('203 인버터') ? '203 인버터' : item.name,
      };
    });
  }

  /** --------------- MONTHLY ----------------- */
  updateMonthlyPage(): void {
    console.log('updateMonthlyPage called with:', {
      startDate: this.startMonthlyDate,
      endDate: this.endMonthlyDate,
    });

    // Chart Label
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(
      this.endMonthlyDate,
      this.startMonthlyDate
    );

    console.log('Generated monthly chart labels:', this.chartMonthlyLabels);

    // Table First Labels
    this.tableMonthlyLabels = ['인버터', ...this.chartMonthlyLabels];

    // Empty dataset
    this.barchartMonthly.resetDataset();

    this.semsService
      .getEfficiencyMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .subscribe((res) => {
        const apiData = this.normalizeApiPayload(res);

        const synced = this.ontestUtil.syncGenerationGridData(
          this.chartMonthlyLabels,
          apiData,
          'efficiency',
          this.barchartMonthly,
          'yy-MM',
          undefined,
          undefined,
          this.site
        );

        // Table rows with clean displayName
        this.tableMonthlyData = this.attachDisplayNames(synced);

        // Ensure legend labels are also normalized
        this.normalizeChartLegendLabels(this.barchartMonthly);
      });
  }

  /** --------------- DAILY ----------------- */
  async updateDailyPage(): Promise<void> {
    console.log('updateDailyPage called with:', {
      startDate: this.startDailyDate,
      endDate: this.endDailyDate,
    });

    // Chart Label
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(
      this.startDailyDate,
      this.endDailyDate
    );

    console.log('Generated chart labels:', this.chartDailyLabels);

    // Table First Labels
    this.tableDailyLabels = ['인버터', ...this.chartDailyLabels];

    // Empty dataset
    this.barchartDaily.resetDataset();

    this.semsService
      .getEfficiencyDaily(this.startDailyDate, this.endDailyDate)
      .subscribe((res) => {
        const apiData = this.normalizeApiPayload(res);

        const synced = this.ontestUtil.syncGenerationGridData(
          this.chartDailyLabels,
          apiData,
          'efficiency',
          this.barchartDaily,
          'MM-dd',
          undefined,
          undefined,
          this.site
        );

        this.tableDailyData = this.attachDisplayNames(synced);

        // Normalize legend labels
        this.normalizeChartLegendLabels(this.barchartDaily);
      });
  }

  /** --------------- HOURLY ----------------- */
  updateHourlyPage(): void {
    // Chart Label
    this.chartTimeLabels = DateUtils.getSpanTimeStringArray();

    // Table First Labels
    this.tableTimeLabels = ['인버터', ...this.chartTimeLabels];

    // Empty dataset
    this.barchartHourly.resetDataset();

    this.semsService.getEfficiencyHourly(this.timeDate).subscribe((res) => {
      const apiData = this.normalizeApiPayload(res);

      const synced = this.ontestUtil.syncGenerationGridData(
        this.chartTimeLabels,
        apiData,
        'efficiency',
        this.barchartHourly,
        'HH',
        'hourly',
        undefined,
        this.site
      );

      this.tableTimeData = this.attachDisplayNames(synced);

      // Normalize legend labels
      this.normalizeChartLegendLabels(this.barchartHourly);
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
    // Update min constraint for end date
    this.endMinMonthlyDate = this.startMonthlyDate;
    datepicker.close();
    // Automatically update the chart when start date is changed
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
    // Automatically update the chart when end date is changed
    this.updateMonthlyPage();
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    console.log('Start date selected:', normalizedDate.toDate());
    this.startDailyDate = normalizedDate.toDate();
    // Update min/max constraints for end date
    this.endMinDailyDate = this.startDailyDate;
    // Automatically update the chart when start date is changed
    this.updateDailyPage();
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    console.log('End date selected:', normalizedDate.toDate());
    this.endDailyDate = normalizedDate.toDate();
    // Automatically update the chart when end date is changed
    this.updateDailyPage();
  }

  // Time ------------------------------------------------------------
  onHourlyDateSelected(normalizedDate: Moment) {
    this.timeDate = normalizedDate.toDate();
    // Automatically update the chart when date is changed
    this.updateHourlyPage();
  }

  openDialog() {
    this.router.navigate(['/invertor/alarm']);
  }
}
