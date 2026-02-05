import {
  Component, OnInit, ViewChild,
  AfterViewInit, AfterContentInit, Input
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
import { TotalGenerationBoardComponent } from "../total-generation-board/total-generation-board.component";
import { Config, Facility } from "../home.component";

@Component({
  selector: 'app-solar-power-board',
  templateUrl: './solar-energy-generation-board.component.html',
  styleUrls: ['./solar-energy-generation-board.component.scss']
})
export class SolarEnergyGenerationBoardComponent implements OnInit, AfterViewInit, AfterContentInit {
  @ViewChild('barChart') barChart!: BarChartComponent;
  @Input() totalGenerationBoardComponent: TotalGenerationBoardComponent;

  // Font awesome
  faSolarPanel = faSolarPanel;

  timeDate: Date = moment().toDate();
  startMonthlyDate!: Date;
  endMonthlyDate!: Date;
  chartLabels: string[] = [];
  showLegend: boolean = false;
  animation: any = true;
  tableTimeData!: InvertorSummary[];
  chartJsUtils = new ChartJsUtils();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  apiData: InvertorSummary[];
  resSite: any;
  selectedFacility: number = 0;
  facilities: { id: number, title: string }[];

  private timer: Observable<number>;
  private subscription: Subscription;

  @Input() config: Config = {
    title: '',
    subTitle: '',
    api1: '',
    api2: '',
    colorIndex: 0,
    fieldName: '',
    unit: '',
    barChartFieldName: ''
  };

  chartUtil: ChartJsUtils = new ChartJsUtils();

  constructor(
    private semsService: SemsService,
    public themeService: ThemeService
  ) {
    console.log('[SolarEnergyGenerationBoardComponent] - constructor');
    this.startMonthlyDate = semsService.getInstalledDate();
    this.endMonthlyDate = new Date();
    this.chartLabels = DateUtils.getBarChartLabel(this.timeDate);
    console.log('SolarEnergyGenerationBoardComponent', this.chartLabels);
  }

  ngOnInit(): void {
    console.log('[SolarEnergyGenerationBoardComponent] - ngOnInit');
    this.timer = timer(0, 10000);

    this.subscription = this.timer.subscribe(n => {
      this.barChart.resetDataset();

      /**
       * ================================
       * MOCK DATA SECTION
       * ================================
       * NOTE: The real API calls are commented out below.
       * Remove the mock block and uncomment the real API calls
       * when backend data is ready.
       */

      // Mock site response (simulate API)
     /*  this.resSite = { siteIndex: 1, siteName: 'Mock Solar Site' }; */

      // Mock generation data (facilityId should match what chartRendering expects)
      /* const mockData: InvertorSummary[] = [
        { facilityId: 0, powerAvg: 20, date: '2025-08-01' } as any,
        { facilityId: 0, powerAvg: 35, date: '2025-08-02' } as any,
        { facilityId: 0, powerAvg: 50, date: '2025-08-03' } as any,
        { facilityId: 0, powerAvg: 40, date: '2025-08-04' } as any,
        { facilityId: 0, powerAvg: 60, date: '2025-08-05' } as any
      ];

      this.animation = false;
      this.apiData = mockData;
      this.chartRendering(0); */

      // ================================
      // REAL API CALLS (uncomment when backend is ready)
      // ================================
      this.semsService.getSite().subscribe(resSite => {
        this.resSite = resSite;
        this.semsService.getGenerationQuantityWeek(this.timeDate, resSite.siteIndex, this.config)
          .subscribe(res => {
            this.animation = false;
            console.log(res);
            this.apiData = res;
            this.chartRendering(0);
          });
      });
    });
  }

  private chartRendering(facilityId: number) {
    console.log('chartRendering', this.config);

    // Update facility list
    for (let data of this.apiData) {
      this.facilities = this.onTestUtil.facilities;
    }

    // Filter by selected facility
    let data = this.apiData.filter(value => value.facilityId == facilityId);

    // Sync data into the bar chart
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

  ngOnDestroy(): void {
    console.log(this.subscription);
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngAfterViewInit() { }

  ngAfterContentInit() { }

  addDataset() {
    // Example placeholder
    // this.barChart.addDataset("label", this.tableMonthlyData, this.chartJsUtils.getColorNext());
  }

  changeData(facility: Facility) {
    console.log(facility);
    this.selectedFacility = facility.id;
    this.barChart.resetDataset();
    this.chartRendering(facility.id);
    this.totalGenerationBoardComponent.getTotalData();
  }
}
