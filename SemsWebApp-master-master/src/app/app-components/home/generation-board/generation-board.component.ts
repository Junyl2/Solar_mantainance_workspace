import { Component, OnInit, ViewChild,
         AfterViewInit, AfterContentInit } from '@angular/core';

// Utils
import { DateUtils } from '../../../utils/date-utils';
import { ChartJsUtils } from 'src/app/utils/chartjs-utils';

// UI Components
import { BarChartComponent } from '../../../ui-components/bar-chart/bar-chart.component';

// Services
import { ThemeService } from '../../../services/theme-service';
import { SemsService } from '../../../services/sems-service';

import {
  faSolarPanel,
} from '@fortawesome/free-solid-svg-icons';
import { OntestUtils } from 'src/app/utils/ontest-utils';
import { InvertorSummary } from 'src/app/models/invertor-summary';
import { from } from 'rxjs';
import moment from 'moment';

@Component({
  selector: 'app-generation-board',
  templateUrl: './generation-board.component.html',
  styleUrls: ['./generation-board.component.scss']
})
export class GenerationBoardComponent implements OnInit, AfterViewInit, AfterContentInit {
  @ViewChild('barChart') barChart! : BarChartComponent;
  // Font awesome
  faSolarPanel = faSolarPanel;

  timeDate: Date = moment().toDate();

  startMonthlyDate!: Date;
  endMonthlyDate!: Date;
  chartLabels: string[] = [];
  tableTimeData! : InvertorSummary[];

  chartJsUtils = new ChartJsUtils();
  private onTestUtil : OntestUtils = new OntestUtils(this.semsService);

  constructor(private semsService: SemsService,
              public themeService:ThemeService) {
    console.log('[GenerationBoardComponent] - constructor')
    this.startMonthlyDate = semsService.getInstalledDate();
    this.endMonthlyDate = new Date();
    this.chartLabels = DateUtils.getSpanTimeStringArray();
  }

  ngOnInit(): void {
    console.log('[GenerationBoardComponent] - ngOnInit')
    this.semsService.getSite().subscribe(resSite => {
      this.semsService.getGenerationQuantityHourly(this.timeDate)
      .subscribe(res => {
        const apiData = res;
        this.tableTimeData = this.onTestUtil.syncGenerationGridData(this.chartLabels, apiData, 'powerAvg', this.barChart, 'HH', 'hourly', undefined, resSite);
      })
    })
  }

  ngAfterViewInit() {

  }

  ngAfterContentInit() {

  }



  addDataset() {
    // var data = [65, 59, 80, 81, 56, 55, 40];
    // this.barChart.addDataset("label", this.tableMonthlyData, this.chartJsUtils.getColorNext());
  }
}
