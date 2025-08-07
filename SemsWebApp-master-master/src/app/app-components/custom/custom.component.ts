import {
  Component,
  OnInit,
  SimpleChanges,
  AfterViewInit,
  ViewChild,
  ElementRef,
  AfterContentChecked,
  ChangeDetectorRef
} from '@angular/core'

// Angular Material Datepicker
import { MatDatepicker } from '@angular/material/datepicker'
import { Moment } from 'moment'

import moment from 'moment'

// Services
import { SemsService } from '../../services/sems-service'
import { DateAdapter } from '@angular/material/core'

// Components
import { BarChartComponent } from '../../ui-components/bar-chart/bar-chart.component'

// Utils
import { DateUtils } from '../../utils/date-utils'
import { ChartJsUtils } from '../../utils/chartjs-utils'
import { InvertorSummary } from 'src/app/models/invertor-summary'
import { format } from 'date-fns'
import { ChartType } from 'chart.js'
import { WeatherInfoSummary } from 'src/app/models/weather-info-summary'
import { OntestUtils } from 'src/app/utils/ontest-utils'
@Component({
  selector: 'app-custom',
  templateUrl: './custom.component.html',
  styleUrls: ['./custom.component.scss']
})
export class CustomComponent implements OnInit {
  @ViewChild('barchartMonthly') barchartMonthly!: BarChartComponent
  @ViewChild('barchartDaily') barchartDaily!: BarChartComponent
  @ViewChild('barchartHourly') barchartHourly!: BarChartComponent

  // Utils
  private chartUtil: ChartJsUtils = new ChartJsUtils();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  pickerStartDate = new Date('2021-10-01')
  showChart = true;

  viewChart = (show: boolean) => {
    if (show) {
      this.showChart = true;
    } else {
      this.showChart = false;
    }
  }

  startYMat!: Date
  endYMat!: Date

  selectLabel = {
    generation: {
      label: '발전량 W',
      convertor: 'syncGenerationGridData',
      field: 'powerAvg',
      dataMonthly: 'generationQuantityMonthlySummary',
      dataDaily: 'generationQuantityDailySummary',
      dataHourly: 'generationQuantityHourlySummary',
    },
    efficiency: {
      label: '인버터 %',
      convertor: 'syncGenerationGridData',
      field: 'efficiency',
      dataMonthly: 'efficiencyMonthlySummary',
      dataDaily: 'efficiencyDailySummary',
      dataHourly: 'efficiencyHourlySummary',
    },
    // powerIrradiance: {
    //   label: '일사량대비발전량',
    //   convertor: 'syncGenerationGridData',
    //   field: 'powerIrradiance',
    //   dataMonthly: 'powerIrradianceMonthlySummary',
    //   dataDaily: 'powerIrradianceDailySummary',
    //   dataHourly: 'powerIrradianceHourlySummary'
    // },
    irradiance: {
      label: '일사량 W/㎡',
      convertor: 'syncGenerationGridData',
      field: 'irradianceAvg',
      dataMonthly: 'powerIrradianceMonthlySummary',
      dataDaily: 'powerIrradianceDailySummary',
      dataHourly: 'powerIrradianceHourlySummary',
    },
    temperature: {
      label: '온도 ℃',
      convertor: 'syncWeatherGridData',
      field: 'temp',
      dataMonthly: 'weatherMonthlySummary',
      dataDaily: 'weatherDailySummary',
      dataHourly: 'weatherHourlySummary',
    },
    humidity: {
      label: '습도 %',
      convertor: 'syncWeatherGridData',
      field: 'humidity',
      dataMonthly: 'weatherMonthlySummary',
      dataDaily: 'weatherDailySummary',
      dataHourly: 'weatherHourlySummary',
    },
    direction: {
      label: '풍향',
      convertor: 'syncInvertorGridData',
      field: 'wd',
      dataMonthly: 'weatherMonthlySummary',
      dataDaily: 'weatherDailySummary',
      dataHourly: 'weatherHourlySummary',
    },
    speed: {
      label: '풍속 m/sec',
      convertor: 'syncInvertorGridData',
      field: 'ws',
      dataMonthly: 'weatherMonthlySummary',
      dataDaily: 'weatherDailySummary',
      dataHourly: 'weatherHourlySummary',
    }
  }

  private generationQuantityMonthlySummary!: InvertorSummary[]
  private generationQuantityDailySummary!: InvertorSummary[]
  private generationQuantityHourlySummary!: InvertorSummary[]

  private efficiencyMonthlySummary!: InvertorSummary[]
  private efficiencyDailySummary!: InvertorSummary[]
  private efficiencyHourlySummary!: InvertorSummary[]

  private powerIrradianceMonthlySummary!: InvertorSummary[]
  private powerIrradianceDailySummary!: InvertorSummary[]
  private powerIrradianceHourlySummary!: InvertorSummary[]

  private weatherMonthlySummary!: WeatherInfoSummary[]
  private weatherDailySummary!: WeatherInfoSummary[]
  private weatherHourlySummary!: WeatherInfoSummary[]

  // Monthly ----------------------
  startMonthlyDate: Date = new Date()
  startMinMonthlyDate!: Date
  startMaxMonthlyDate!: Date
  endMonthlyDate: Date = new Date()
  endMinMonthlyDate!: Date
  endMaxMonthlyDate!: Date
  chartMonthlyLabels!: string[]
  tableMonthlyLabels!: string[]
  tableMonthlyData!: any[]

  selectBarchartMonthly: string
  selectBarchartDaily: string
  selectBarchartHourly: string
  selectLinechartMonthly: string
  selectLinechartDaily: string
  selectLinechartHourly: string

  // Daily -------------------------
  startDailyDate: Date = new Date()
  startMinDailyDate!: Date
  startMaxDailyDate!: Date
  endDailyDate: Date = new Date()
  endMinDailyDate!: Date
  endMaxDailyDate!: Date
  chartDailyLabels!: string[]
  tableDailyLabels!: string[]
  tableDailyData!: any[]

  // Hourly --------------------------
  hourlyDate: Date = new Date()
  minTimeDate!: Date
  maxTimeDate!: Date
  chartHourlyLabels!: string[]
  tableHourlyLabels!: string[]
  tableHourlyData!: any[]

  // initialize chart with separate y-axis
  scalesOption = {
    scales: {
      y: {
        id: 'y',
        type: 'linear',
        title: {
          text: '발전량(x/y)',
          display: true,
          align: 'end',
        },
        display: true,
        position: 'left',
      },
      y1: {
        id: 'y1',
        type: 'linear',
        title: {
          text: '변환효율(x/y)',
          display: true,
          align: 'end',
        },
        display: true,
        position: 'right',

        // grid line settings
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
      },
    }
  }

  constructor(
    private semsService: SemsService,
    private dateAdapter: DateAdapter<any>,
    private cdRef: ChangeDetectorRef
  ) {

    // Monthly ----------------------
    this.startMinMonthlyDate = this.semsService.getInstalledDate()
    this.startMaxMonthlyDate = moment().toDate()
    this.endMinMonthlyDate = this.startMinMonthlyDate
    this.endMaxMonthlyDate = this.startMaxMonthlyDate
    this.startMonthlyDate = this.startMinMonthlyDate
    this.endMonthlyDate = moment().toDate()

    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate = this.semsService.getInstalledDate()
    this.startMaxDailyDate = this.endMaxDailyDate = this.endDailyDate = moment().toDate()
    this.startDailyDate = moment()
      .add(-1, 'M')
      .toDate()

    // Time ---------------------------
    this.hourlyDate = this.maxTimeDate = moment().toDate()
    this.minTimeDate = this.semsService.getInstalledDate()
  }

  private site;

  async ngOnInit() {
    this.selectBarchartMonthly = 'generation'
    this.selectLinechartMonthly = 'efficiency'
    this.selectBarchartDaily = 'generation'
    this.selectLinechartDaily = 'efficiency'
    this.selectBarchartHourly = 'generation'
    this.selectLinechartHourly = 'efficiency'

    this.semsService.getSite().subscribe(res => {
      this.site = res;
    })
  }

  async retrieveInitialData() { }

  ngAfterContentChecked(): void { }

  async initMonthlyData() {
    // Monthly ---------------------------
    this.generationQuantityMonthlySummary = await this.semsService
      .getGenerationQuantityMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .toPromise()

    this.powerIrradianceMonthlySummary = await this.semsService
      .getPowerIrradianceMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .toPromise()

    this.efficiencyMonthlySummary = await this.semsService
      .getEfficiencyMonthly(this.startMonthlyDate, this.endMonthlyDate)
      .toPromise()

    this.weatherMonthlySummary = await this.semsService
      .getWeatherSummary(
        'MONTHLY',
        format(this.startMonthlyDate, 'yyyy-MM-dd'),
        format(this.endMonthlyDate, 'yyyy-MM-dd')
      )
      .toPromise()
  }

  async initDailyData() {
    this.generationQuantityDailySummary = await this.semsService
      .getGenerationQuantityDaily(this.startDailyDate, this.endDailyDate)
      .toPromise()

    console.log(this.generationQuantityDailySummary);

    this.powerIrradianceDailySummary = await this.semsService
      .getPowerIrradianceDaily(this.startDailyDate, this.endDailyDate)
      .toPromise()

    this.efficiencyDailySummary = await this.semsService
      .getEfficiencyDaily(this.startDailyDate, this.endDailyDate)
      .toPromise()

    this.weatherDailySummary = await this.semsService
      .getWeatherSummary(
        'DAILY',
        format(this.startDailyDate, 'yyyy-MM-dd'),
        format(this.endDailyDate, 'yyyy-MM-dd')
      )
      .toPromise()
  }

  async initHourlyData() {
    this.generationQuantityHourlySummary = await this.semsService
      .getGenerationQuantityHourly(this.hourlyDate)
      .toPromise()


    console.log(this.generationQuantityHourlySummary);

    this.powerIrradianceHourlySummary = await this.semsService
      .getPowerIrradianceHourly(this.hourlyDate)
      .toPromise()

    this.efficiencyHourlySummary = await this.semsService
      .getEfficiencyHourly(this.hourlyDate)
      .toPromise()

    this.weatherHourlySummary = await this.semsService
      .getWeatherSummary(
        'HOURLY',
        format(this.hourlyDate, 'yyyy-MM-dd'),
        format(moment(this.hourlyDate).add(1, 'd').toDate(), 'yyyy-MM-dd')
      )
      .toPromise()
  }

  updateChartConfigOption(ySelectLabel, y1SelectLabel, chart: BarChartComponent) {
    this.scalesOption.scales.y.title.text = this.selectLabel[ySelectLabel].label;
    this.scalesOption.scales.y1.title.text = this.selectLabel[y1SelectLabel].label;
    chart.addConfigOptions(this.scalesOption);
  }

  async ngAfterViewInit() {
    this.cdRef.detectChanges()

    // initial configuration of y Axis
    this.updateChartConfigOption(this.selectBarchartMonthly, this.selectLinechartMonthly, this.barchartMonthly);
    this.updateChartConfigOption(this.selectBarchartDaily, this.selectLinechartDaily, this.barchartDaily);
    this.updateChartConfigOption(this.selectBarchartHourly, this.selectLinechartHourly, this.barchartHourly);

    // Monthly ----------
    await this.initMonthlyData();
    this.updateMonthlyPage()

    // Daily -----------------------------
    await this.initDailyData();
    this.updateDailyPage()

    // Hours -----------------------------
    await this.initHourlyData();
    this.updateHourlyPage()
  }

  async updateMonthlyPage(init?: boolean) {
    if (init) {
      await this.initMonthlyData();
    }

    // initial configuration of y Axis
    this.updateChartConfigOption(this.selectBarchartMonthly, this.selectLinechartMonthly, this.barchartMonthly);

    // Chart Label
    this.chartMonthlyLabels = DateUtils.getSpanYYMMStringArray(
      this.endMonthlyDate,
      this.startMonthlyDate
    )

    // Table First Labels
    this.tableMonthlyLabels = []
    this.tableMonthlyLabels.push('인버터')
    this.tableMonthlyLabels = this.tableMonthlyLabels.concat(
      this.chartMonthlyLabels
    )

    console.log(this.selectLabel[this.selectLinechartMonthly].convertor);

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.barchartMonthly.resetDataset()

    let datasets = []

    const data1 = {
      // label: this.selectLabel[this.selectBarchartMonthly].label,
      data: this.onTestUtil[
        this.selectLabel[this.selectBarchartMonthly].convertor
      ](
        this.chartMonthlyLabels,
        this[this.selectLabel[this.selectBarchartMonthly].dataMonthly],
        this.selectLabel[this.selectBarchartMonthly].field,
        this.barchartMonthly,
        'yy-MM',
        undefined,
        'bar',
        this.site,
        'y',
      ),
      order: 1,
    }

    datasets.push(data1)

    const data2 = {
      // label: this.selectLabel[this.selectLinechartMonthly].label,
      data: this.onTestUtil[
        this.selectLabel[this.selectLinechartMonthly].convertor
      ](
        this.chartMonthlyLabels,
        this[this.selectLabel[this.selectLinechartMonthly].dataMonthly],
        this.selectLabel[this.selectLinechartMonthly].field,
        this.barchartMonthly,
        'yy-MM',
        undefined,
        'line',
        this.site,
        'y1'
      ),
      type: 'line',
      order: 0,
    }

    datasets.push(data2)

    this.tableMonthlyData = datasets
  }

  async updateDailyPage(update?: boolean): Promise<void> {
    if (update) {
      await this.initDailyData();
    }

    // initial configuration of y Axis
    this.updateChartConfigOption(this.selectBarchartDaily, this.selectLinechartDaily, this.barchartDaily);

    console.log(this.startDailyDate);
    console.log(this.endDailyDate);

    // Chart Label
    this.chartDailyLabels = DateUtils.getSpanMonthDayStringArray(
      this.startDailyDate,
      this.endDailyDate
    )

    console.log(this.chartDailyLabels);

    // Table First Labels
    this.tableDailyLabels = []
    this.tableDailyLabels.push('인버터')
    this.tableDailyLabels = this.tableDailyLabels.concat(this.chartDailyLabels)

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.barchartDaily.resetDataset()

    let datasets = []

    const data1 = {
      label: this.selectLabel[this.selectBarchartDaily].label,
      data: this.onTestUtil[
        this.selectLabel[this.selectBarchartDaily].convertor
      ](
        this.chartDailyLabels,
        this[this.selectLabel[this.selectBarchartDaily].dataDaily],
        this.selectLabel[this.selectBarchartDaily].field,
        this.barchartDaily,
        'MM-dd',
        undefined,
        'bar',
        this.site,
        'y',
      ),
      order: 1
    }

    datasets.push(data1)

    const data2 = {
      label: this.selectLabel[this.selectLinechartDaily].label,
      data: this.onTestUtil[
        this.selectLabel[this.selectLinechartDaily].convertor
      ](
        this.chartDailyLabels,
        this[this.selectLabel[this.selectLinechartDaily].dataDaily],
        this.selectLabel[this.selectLinechartDaily].field,
        this.barchartDaily,
        'MM-dd',
        undefined,
        'line',
        this.site,
        'y1',
      ),
      type: 'line',
      order: 0
    }

    datasets.push(data2)

    console.log(datasets);

    this.tableDailyData = datasets
  }

  async updateHourlyPage(update?: boolean) {
    console.log('update hourly page')
    if (update) {
      await this.initHourlyData();
    }

    // initial configuration of y Axis
    this.updateChartConfigOption(this.selectBarchartHourly, this.selectLinechartHourly, this.barchartHourly);

    // Chart Label
    this.chartHourlyLabels = DateUtils.getSpanTimeStringArray()

    // Table First Labels
    this.tableHourlyLabels = []
    this.tableHourlyLabels.push('인버터')
    this.tableHourlyLabels = this.tableHourlyLabels.concat(this.chartHourlyLabels)

    // Chart Data & Table Data ---------------------------------------------
    // Empty dataset
    this.barchartHourly.resetDataset()

    this.barchartDaily.resetDataset()

    let datasets = []

    console.log(this.selectBarchartHourly);
    console.log(this.selectLabel[this.selectBarchartHourly].dataHourly);
    console.log(this[this.selectLabel[this.selectBarchartHourly].dataHourly]);

    const data1 = {
      label: this.selectLabel[this.selectBarchartHourly].label,
      data: this.onTestUtil[
        this.selectLabel[this.selectBarchartHourly].convertor
      ](
        this.chartHourlyLabels,
        this[this.selectLabel[this.selectBarchartHourly].dataHourly],
        this.selectLabel[this.selectBarchartHourly].field,
        this.barchartHourly,
        'HH',
        'hourly',
        'bar',
        this.site,
        'y',
      ),
      order: 1
    }

    datasets.push(data1)

    const data2 = {
      label: this.selectLabel[this.selectLinechartHourly].label,
      data: this.onTestUtil[
        this.selectLabel[this.selectLinechartHourly].convertor
      ](
        this.chartHourlyLabels,
        this[this.selectLabel[this.selectLinechartHourly].dataHourly],
        this.selectLabel[this.selectLinechartHourly].field,
        this.barchartHourly,
        'HH',
        'hourly',
        'line',
        this.site,
        'y1'
      ),
      type: 'line',
      order: 0
    }

    datasets.push(data2)

    this.tableHourlyData = datasets
  }

  ngOnChanges(changes: SimpleChanges) { }

  // Monthly ------------------------------------------------------
  onStartMonthlyYearSelected(normalizedYear: Moment) {
    this.startMonthlyDate.setFullYear(normalizedYear.year())
  }
  onStartMonthlyMonthSelected(
    normalizedMonth: Moment,
    datepicker: MatDatepicker<Date>
  ) {
    this.startMonthlyDate.setFullYear(normalizedMonth.year())
    this.startMonthlyDate.setMonth(normalizedMonth.month())
    this.startMonthlyDate = new Date(this.startMonthlyDate)

    datepicker.close()
  }

  onEndMonthlyYearSelected(normalizedYear: Moment) {
    this.endMonthlyDate.setFullYear(normalizedYear.year())
  }
  onEndMonthlyMonthSelected(normalizedMonth: Moment, datepicker: MatDatepicker<Date>) {
    this.endMonthlyDate = normalizedMonth.endOf('month').toDate();
    datepicker.close()
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    console.log(normalizedDate);
    this.startDailyDate = normalizedDate.local().toDate();
    console.log(normalizedDate.toDate());
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.local().toDate()
  }

  // Time ------------------------------------------------------------

  onHourlyDateSelected(normalizedDate: Moment) {
    this.hourlyDate = normalizedDate.local().toDate()
  }
}
