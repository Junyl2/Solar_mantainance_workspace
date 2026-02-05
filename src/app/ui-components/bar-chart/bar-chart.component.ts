import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  AfterViewInit,
  Input,
  SimpleChanges
} from '@angular/core'

import {
  ChartType,
  ChartItem,
  Chart,
  ChartData,
  ChartDataset,
  ChartConfiguration,
  ArcElement,
  LineElement,
  BarElement,
  PointElement,
  BarController,
  BubbleController,
  DoughnutController,
  LineController,
  PieController,
  PolarAreaController,
  RadarController,
  ScatterController,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  RadialLinearScale,
  TimeScale,
  TimeSeriesScale,
  BarOptions,
  // Decimation,
  Filler,
  Legend,
  Title,
  Tooltip,
  ChartOptions
} from 'node_modules/chart.js'

@Component({
  selector: 'bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrls: ['./bar-chart.component.css']
})
export class BarChartComponent implements OnInit, AfterViewInit {
  @ViewChild('canvasBarChartViewChild') chartElement!: ElementRef
  private chartType: ChartType = 'bar'

  @Input() labels: string[] = []
  @Input() showLegend: boolean = true;
  @Input() animation: any = true;

  // @Input() data

  private chart!: Chart
  private chartConfig!: ChartConfiguration
  private chartData!: ChartData
  chartOption!: ChartOptions;

  constructor(private elementRef: ElementRef) {
    console.log('[BarChartComponent] - constructor');
    Chart.register(
      ArcElement,
      LineElement,
      BarElement,
      PointElement,
      BarController,
      BubbleController,
      DoughnutController,
      LineController,
      PieController,
      PolarAreaController,
      RadarController,
      ScatterController,
      CategoryScale,
      LinearScale,
      LogarithmicScale,
      RadialLinearScale,
      TimeScale,
      TimeSeriesScale,
      Filler,
      Legend,
      Title,
      Tooltip
    )
  }

  ngOnInit() {
    this.chartData = {
      labels: this.labels,
      datasets: []
    }

    this.chartOption = {
      animation: false,
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          display: this.showLegend
        }
      }
    }

    this.chartConfig = {
      type: this.chartType,
      options: {
        ...this.chartOption,
      },
      data: this.chartData
    }
  }

      ngOnChanges(changes: SimpleChanges) {
    if (changes['labels'] && !changes['labels'].isFirstChange()) {
      if (changes['labels'].previousValue !== changes['labels'].currentValue) {
        this.labels = changes['labels'].currentValue;
        this.chart.data.labels = this.labels;
        this.chart.update();
      }
    }
  }

  ngAfterViewInit() {
    console.log('ngAfterViewInit');
    const nativeChart = this.chartElement.nativeElement
    this.chart = new Chart(
      nativeChart, // Chart element
      this.chartConfig //
    )
  }

  addConfigOptions(additionOptions: {}) {
    this.chart.destroy();
    const nativeChart = this.chartElement.nativeElement;

    this.chartConfig.options = {
      ...this.chartConfig.options,
      ...additionOptions
    };

    this.chart = new Chart(
      nativeChart,
      this.chartConfig
    );
  }

  addDataset(label: string, data: number[], color: string, type?: ChartType | 'bar', yAxisID?: string) {
    this.chartData.datasets.push({
      label: label,
      data: data, // [65, 59, 80, 81, 56, 55, 40],
      // fill: false,
      type: type,
      borderColor: color,
      backgroundColor: color,
      // tension: 0.0,
      yAxisID: yAxisID,
    })
    this.chart.update()
  }

  resetDataset(): void {
    this.chartData.datasets = []
  }
}
