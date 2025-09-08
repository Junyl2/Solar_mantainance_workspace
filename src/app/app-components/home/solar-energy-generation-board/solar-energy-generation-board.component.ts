import {
  Component,
  OnInit,
  ViewChild,
  AfterViewInit,
  AfterContentInit,
  OnDestroy,
  Input,
} from '@angular/core';

// Timer
import { timer, Subscription, Observable } from 'rxjs';

// Utils
import { DateUtils } from '../../../utils/date-utils';
import { ChartJsUtils } from 'src/app/utils/chartjs-utils';

// UI Components
import { BarChartComponent } from '../../../ui-components/bar-chart/bar-chart.component';

// Services
import { ThemeService } from '../../../services/theme-service';
import { SemsService } from '../../../services/sems-service';

import { faSolarPanel } from '@fortawesome/free-solid-svg-icons';
import { OntestUtils } from 'src/app/utils/ontest-utils';
import { InvertorSummary } from 'src/app/models/invertor-summary';
import moment from 'moment';
import { TotalGenerationBoardComponent } from '../total-generation-board/total-generation-board.component';
import { Config, Facility } from '../home.component';

@Component({
  selector: 'app-solar-power-board',
  templateUrl: './solar-energy-generation-board.component.html',
  styleUrls: ['./solar-energy-generation-board.component.scss'],
})
export class SolarEnergyGenerationBoardComponent
  implements OnInit, AfterViewInit, AfterContentInit, OnDestroy
{
  @ViewChild('barChart') barChart!: BarChartComponent;
  @Input() totalGenerationBoardComponent!: TotalGenerationBoardComponent;

  // Font awesome
  faSolarPanel = faSolarPanel;

  timeDate: Date = moment().toDate();
  startMonthlyDate!: Date;
  endMonthlyDate!: Date;

  chartLabels: string[] = [];
  showLegend = false;
  animation: any = true;

  tableTimeData!: InvertorSummary[];
  apiData: InvertorSummary[] = [];
  resSite: any;

  selectedFacility: number = 0; // 0 = 전체/All
  facilities: { id: number; title: string }[] = [{ id: 0, title: '전체' }];

  private onTestUtil: OntestUtils;
  chartUtil: ChartJsUtils = new ChartJsUtils();

  private timer$!: Observable<number>;
  private subscription!: Subscription;

  // Map backend facilityId -> display title (from API facilityTitle)
  private facilityTitleMap = new Map<number, string>();

  @Input() config: Config = {
    title: '',
    subTitle: '',
    api1: '',
    api2: '',
    colorIndex: 0,
    fieldName: '',
    unit: '',
    barChartFieldName: '',
  };

  constructor(
    private semsService: SemsService,
    public themeService: ThemeService
  ) {
    console.log('[SolarEnergyGenerationBoardComponent] - constructor');
    this.startMonthlyDate = semsService.getInstalledDate();
    this.endMonthlyDate = new Date();
    this.chartLabels = DateUtils.getBarChartLabel(this.timeDate);
    console.log(
      'SolarEnergyGenerationBoardComponent labels:',
      this.chartLabels
    );

    this.onTestUtil = new OntestUtils(this.semsService);
  }

  ngOnInit(): void {
    console.log('[SolarEnergyGenerationBoardComponent] - ngOnInit');
    this.timer$ = timer(0, 10000);

    this.subscription = this.timer$.subscribe(() => {
      if (this.barChart) this.barChart.resetDataset();

      // REAL API CALLS
      this.semsService.getSite().subscribe((resSite) => {
        this.resSite = resSite;

        this.semsService
          .getGenerationQuantityWeek(
            this.timeDate,
            resSite.siteIndex,
            this.config
          )
          .subscribe((res) => {
            this.animation = false;
            this.apiData = res || [];

            // (Re)build title map from latest API data
            this.buildFacilityTitleMap();

            // Default to 전체 (all) on each refresh to avoid empty state
            const nextSelected = this.selectedFacility || 0;
            this.chartRendering(nextSelected);
          });
      });
    });
  }

  ngAfterViewInit() {}
  ngAfterContentInit() {}

  ngOnDestroy(): void {
    if (this.subscription) this.subscription.unsubscribe();
  }

  // ---- helpers -------------------------------------------------------------

  /** Build a map from backend facilityId -> API facilityTitle (with safe fallbacks). */
  private buildFacilityTitleMap(): void {
    this.facilityTitleMap.clear();
    for (const d of this.apiData ?? []) {
      const id = (d as any)?.facilityId as number | undefined;
      const title = (d as any)?.facilityTitle as string | undefined;
      if (typeof id === 'number' && !this.facilityTitleMap.has(id)) {
        const safeTitle =
          (title && title.trim()) ||
          (this.onTestUtil as any)?.facilityNameMap?.[id] ||
          `인버터 ${id}`;
        this.facilityTitleMap.set(id, safeTitle);
      }
    }
  }

  /** Get the UI label for a given facility id (prefer API title, then OntestUtils, then fallback). */
  private getFacilityTitle(id: number): string {
    if (id === 0) return '전체';

    // 1) API-provided title
    const apiTitle = this.facilityTitleMap.get(id);
    if (apiTitle) return apiTitle;

    // 2) Optional pretty-name map from OntestUtils
    const nameMap = (this.onTestUtil as any)?.facilityNameMap as
      | Record<number, string>
      | undefined;
    if (nameMap?.[id]) return nameMap[id];

    // 3) Final fallback
    return `인버터 ${id}`;
  }

  /** Rebuild the chips from whatever facilityId's the API returns (using facilityTitle for labels). */
  private rebuildFacilitiesFromApi(): void {
    // Unique facility IDs found in apiData
    const uniqueIds = Array.from(
      new Set((this.apiData ?? []).map((d: any) => d?.facilityId))
    )
      .filter((id): id is number => typeof id === 'number')
      .sort((a, b) => a - b);

    // Always start with 전체
    const list: { id: number; title: string }[] = [{ id: 0, title: '전체' }];

    for (const id of uniqueIds) {
      if (id === 0) continue; // already added
      list.push({ id, title: this.getFacilityTitle(id) });
    }

    this.facilities = list;

    // Keep selected valid; if it vanished, reset to 전체
    const ids = new Set(this.facilities.map((f) => f.id));
    if (!ids.has(this.selectedFacility)) this.selectedFacility = 0;
  }

  // ---- main render pipeline -----------------------------------------------

  private chartRendering(facilityId: number): void {
    // 1) Build/refresh facility chips (labels from API facilityTitle)
    this.rebuildFacilitiesFromApi();

    // 2) Filter by facility; 0 = 전체
    const data =
      facilityId === 0
        ? this.apiData
        : (this.apiData ?? []).filter((v: any) => v?.facilityId === facilityId);

    // 3) Sync to chart
    this.tableTimeData = this.onTestUtil.syncGenerationGridDataByFacility(
      this.chartLabels,
      data,
      this.config.barChartFieldName,
      this.barChart,
      'MM-dd',
      'hourly',
      undefined,
      this.resSite,
      undefined,
      this.chartUtil.CHART_COLORS[this.config.colorIndex]
    );
  }

  // ---- UI events -----------------------------------------------------------

  changeData(facility: Facility) {
    this.selectedFacility = facility.id;
    if (this.barChart) this.barChart.resetDataset();
    this.chartRendering(facility.id);

    // If you really need to refresh totals in the parent board:
    if (this.totalGenerationBoardComponent?.getTotalData) {
      this.totalGenerationBoardComponent.getTotalData();
    }
  }
}
