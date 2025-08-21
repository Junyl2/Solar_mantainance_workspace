import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ChangeDetectorRef,
  ElementRef,
} from '@angular/core';
import { SemsService } from '../../../services/sems-service';
import { Chart, registerables } from 'chart.js';
import { BreakpointObserver } from '@angular/cdk/layout';
import moment from 'moment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.scss'],
})
export class TemperatureComponent implements OnInit, AfterViewInit {
  @ViewChild('chart_temperature', { static: true }) chartRef: ElementRef;

  chart: Chart;
  isMobile = false;
  isTablet = false;

  invList = [];
  colorArray: any = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(75,192,134,0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(201, 203, 207, 0.8)',
    'rgba(154,235,54,0.8)',
    'rgba(236,111,227,0.8)',
  ];
  startDate: Date = new Date();
  endDate: Date = new Date();
  startMonthDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  tempMonthDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );
  endMonthDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    this.tempMonthDate.getDate()
  );
  tableHeadData: any = [];
  tableDayData: any = [];
  tableData: any = [];
  gbn = '';
  insNum = 0;
  dateList: any = [];

  constructor(
    private semsService: SemsService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef
  ) {
    Chart.register(...registerables);
  }

  // ---------- helpers (Node 14 호환) ----------
  private toHourIndex(tp: any): number {
    if (tp == null) return -1;
    const s = String(tp);
    const m = s.match(/\b([01]?\d|2[0-3])\b/);
    if (m) return parseInt(m[1], 10);
    const n = Number(s);
    return Number.isFinite(n) && n >= 0 && n <= 23 ? n : -1;
  }

  /** pick a numeric value key from a sample row */
  private firstNumberKey(o: any, preferred: string[] = []): string | null {
    if (!o || typeof o !== 'object') return null;
    for (const k of preferred) if (k in o && typeof o[k] === 'number') return k;
    for (const k of Object.keys(o)) {
      if (
        ['timePeriod', 'date', 'inverterId', 'id', 'name', 'label'].includes(k)
      )
        continue;
      if (typeof o[k] === 'number') return k;
    }
    return null;
  }

  private buildHourSeries(arr: any[], preferredKeys: string[]): number[] {
    const out = new Array(24).fill(0);
    if (!Array.isArray(arr) || arr.length === 0) return out;

    // Node 14 호환: ?? 대신 || 사용
    const key =
      this.firstNumberKey(arr[0], preferredKeys) ||
      this.firstNumberKey(arr[0], []);
    if (!key) return out;

    for (const r of arr) {
      // Node 14 호환: ?? 대신 || 사용
      const h = this.toHourIndex(r.timePeriod || r.hour || r.time);
      const v = r[key];
      if (h >= 0 && h < 24 && typeof v === 'number') out[h] = v;
    }
    return out;
  }

  private buildSeriesByLabels(
    arr: any[],
    labels: string[],
    preferredKeys: string[],
    labelKeyGuess?: string
  ): number[] {
    const out = labels.map(() => 0);
    if (!Array.isArray(arr) || arr.length === 0) return out;

    // Node 14 호환: ?? 대신 || 사용
    const valueKey =
      this.firstNumberKey(arr[0], preferredKeys) ||
      this.firstNumberKey(arr[0], []);
    if (!valueKey) return out;

    const labelKey =
      labelKeyGuess ||
      ('date' in arr[0]
        ? 'date'
        : 'timePeriod' in arr[0]
        ? 'timePeriod'
        : null);
    if (!labelKey) return out;

    const map = new Map<string, number>();
    for (const r of arr) {
      // Node 14 호환: ?? 대신 || 사용
      const lbl = String(r[labelKey] || '');
      const v = r[valueKey];
      if (lbl && typeof v === 'number') map.set(lbl, v);
    }
    // Node 14 호환: ?? 대신 || 사용
    return labels.map((l) => map.get(l) || 0);
  }

  // 데이터 단위 변환 함수 추가
  private formatTemperatureData(data: number[]): string[] {
    return data.map((value) => `${value}°C`);
  }

  private formatPowerData(data: number[]): string[] {
    return data.map((value) => `${value}kWh`);
  }
  // ---------- end helpers ----------

  updateChartAspectRatio() {
    if (!this.chart) return;
    this.chart.options.aspectRatio = this.isMobile
      ? 0.6
      : this.isTablet
      ? 1.5
      : 2.5;
    this.chart.update();
  }

  ngOnInit(): void {
    this.radio_input1_click();
  }

  ngAfterViewInit(): void {
    this.getAnalyzeTemperatureInvList();

    this.breakpointObserver
      .observe([
        '(max-width: 767px)',
        '(min-width: 768px) and (max-width: 1024px)',
      ])
      .subscribe((result) => {
        if (result.breakpoints['(max-width: 767px)']) {
          this.isMobile = true;
          this.isTablet = false;
        } else if (
          result.breakpoints['(min-width: 768px) and (max-width: 1024px)']
        ) {
          this.isTablet = true;
          this.isMobile = false;
        } else {
          this.isMobile = false;
          this.isTablet = false;
        }
        if (this.chart) this.updateChartAspectRatio();
      });

    this.createChart();
  }

  getAnalyzeTemperatureInvList() {
    this.semsService.getAnalyzeTemperatureInvList().subscribe((res) => {
      console.log('Original response:', res);
      // Filter only 202 and 204
      const filtered = (res || []).filter(
        (i: any) => i[1] === 202 || i[1] === 204
      );
      console.log('Filtered list:', filtered);

      setTimeout(() => {
        this.invList = filtered.map((i: any) => ({
          viewValue: i[0],
          value: i[1],
        }));
        console.log('Mapped invList for dropdown:', this.invList);
        this.cdr.detectChanges();
      });
    });
  }

  // Create initial chart
  createChart() {
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels: [
          '00시',
          '01시',
          '02시',
          '03시',
          '04시',
          '05시',
          '06시',
          '07시',
          '08시',
          '09시',
          '10시',
          '11시',
          '12시',
          '13시',
          '14시',
          '15시',
          '16시',
          '17시',
          '18시',
          '19시',
          '20시',
          '21시',
          '22시',
          '23시',
        ],
        datasets: [
          {
            label: '인버터 발전량',
            data: [],
            borderColor: 'rgba(0,0,0,0.8)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            yAxisID: 'yLeftMain',
            type: 'line',
          },
          {
            label: '어레이 상부',
            data: [],
            borderColor: 'rgba(255,99,132,0.8)',
            backgroundColor: 'rgba(255,99,132,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          },
          {
            label: '어레이 중부',
            data: [],
            borderColor: 'rgba(75,192,134,0.8)',
            backgroundColor: 'rgba(75,192,134,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          },
          {
            label: '어레이 하부',
            data: [],
            borderColor: 'rgba(54,162,235,0.8)',
            backgroundColor: 'rgba(54,162,235,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          },
          {
            label: '어레이 상부 주변',
            data: [],
            borderColor: 'rgba(153,102,255,0.8)',
            backgroundColor: 'rgba(153,102,255,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          },
          {
            label: '어레이 중부 주변',
            data: [],
            borderColor: 'rgba(255,159,64,0.8)',
            backgroundColor: 'rgba(255,159,64,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          },
          {
            label: '어레이 하부 주변',
            data: [],
            borderColor: 'rgba(255,205,86,0.8)',
            backgroundColor: 'rgba(255,205,86,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          },
        ],
      },
      options: {
        aspectRatio: this.isMobile ? 0.6 : this.isTablet ? 1.5 : 2.5,
        scales: {
          yLeftMain: {
            type: 'linear',
            display: true,
            position: 'left',
            title: { display: true, text: '인버터 발전량 kWh', color: '#000' },
            min: 0,
            max: 20000,
            ticks: { stepSize: 200, color: '#000' },
            grid: { drawOnChartArea: true, color: 'rgba(0,0,0,0.1)' },
          },
          yRight: {
            type: 'linear',
            display: true,
            position: 'right',
            title: { display: true, text: '온도 °C', color: '#000' }, // 온도 단위 추가
            min: 0,
            max: 100,
            ticks: {
              stepSize: 10,
              color: '#000',
              callback: (value: any) => Number(value).toFixed(0),
            },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  radio_input1_click() {
    (document.getElementById('radio_time') as HTMLInputElement).checked = true;
    document.getElementById('date_start')!.style.display = 'flex';
    document.getElementById('date_space')!.style.display = 'none';
    document.getElementById('date_end')!.style.display = 'none';
    document.getElementById('date_start_month')!.style.display = 'none';
    document.getElementById('date_end_month')!.style.display = 'none';
  }

  radio_input2_click() {
    (document.getElementById('radio_day') as HTMLInputElement).checked = true;
    document.getElementById('date_start')!.style.display = '';
    document.getElementById('date_space')!.style.display = 'flex';
    document.getElementById('date_start')!.style.display = 'flex';
    document.getElementById('date_end')!.style.display = 'flex';
    document.getElementById('date_start_month')!.style.display = 'none';
    document.getElementById('date_end_month')!.style.display = 'none';
  }

  radio_input3_click() {
    (document.getElementById('radio_month') as HTMLInputElement).checked = true;
    document.getElementById('date_start')!.style.display = '';
    document.getElementById('date_space')!.style.display = 'flex';
    document.getElementById('date_start')!.style.display = 'none';
    document.getElementById('date_end')!.style.display = 'none';
    document.getElementById('date_start_month')!.style.display = 'flex';
    document.getElementById('date_end_month')!.style.display = 'flex';
  }

  onStartDaySelected(normalizedDate: any) {
    this.startDate = normalizedDate.toDate();
  }

  onEndDaySelected(normalizedDate: any) {
    this.endDate = normalizedDate.toDate();
  }

  onStartMonthSelected(normalizedYear: any) {
    this.startMonthDate.setFullYear(normalizedYear.year());
  }

  onStartMonthMonthSelected(normalizedMonth: any, datepicker: any) {
    this.startMonthDate.setFullYear(normalizedMonth.year());
    this.startMonthDate.setMonth(normalizedMonth.month());
    this.startMonthDate = new Date(
      this.startMonthDate.getFullYear(),
      this.startMonthDate.getMonth(),
      1
    );
    datepicker.close();
  }

  onEndMonthSelected(normalizedYear: any) {
    this.endMonthDate.setFullYear(normalizedYear.year());
  }

  onEndMonthMonthSelected(normalizedMonth: any, datepicker: any) {
    this.endMonthDate.setFullYear(normalizedMonth.year());
    this.endMonthDate.setMonth(normalizedMonth.month());
    const tempDate = new Date(
      this.endMonthDate.getFullYear(),
      normalizedMonth.month() + 1,
      0
    );
    this.endMonthDate = new Date(
      this.endMonthDate.getFullYear(),
      normalizedMonth.month(),
      tempDate.getDate()
    );
    datepicker.close();
  }

  search_click() {
    console.log('search_click triggered');
    let gbn: 'time' | 'day' | 'month';
    let startDate: string;
    let endDate: string;

    if ((document.getElementById('radio_time') as HTMLInputElement).checked) {
      gbn = 'time';
      startDate = moment(this.startDate).format('YYYYMMDD');
      endDate = moment(this.startDate).add(1, 'days').format('YYYYMMDD');
    } else if (
      (document.getElementById('radio_day') as HTMLInputElement).checked
    ) {
      gbn = 'day';
      startDate = moment(this.startDate).format('YYYYMMDD');
      endDate = moment(this.endDate).add(1, 'days').format('YYYYMMDD');
    } else {
      gbn = 'month';
      startDate = moment(this.startMonthDate).format('YYYYMMDD');
      endDate = moment(this.endMonthDate).add(1, 'days').format('YYYYMMDD');
    }

    this.semsService
      .getAnalyzeTemperatureInfo(
        gbn,
        this.insNum.toString(),
        startDate,
        endDate
      )
      .subscribe({
        next: (res) => {
          console.log('API response:', res);

          // Node 14 호환: ?? 대신 || 사용하고 기본값 제공
          const inverterData = (res && res.inverterGenerationData) || [];
          const arrayUpper = (res && res.arrayUpperData) || [];
          const arrayMiddle = (res && res.arrayMiddleData) || [];
          const arrayLower = (res && res.arrayLowerData) || [];
          const ambientUpper = (res && res.ambientUpperData) || [];
          const ambientMiddle = (res && res.ambientMiddleData) || [];
          const ambientLower = (res && res.ambientLowerData) || [];

          if (this.chart) {
            this.chart.destroy();
            this.chart = null;
          }

          this.tableHeadData = [];
          this.tableData = [];

          // Build base chart
          const chartObject: any = {
            type: 'line',
            data: { labels: [], datasets: [] },
            options: {
              aspectRatio: this.isMobile ? 0.6 : this.isTablet ? 1.5 : 2.5,
              scales: {
                yLeftMain: {
                  type: 'linear',
                  display: true,
                  position: 'left',
                  title: {
                    display: true,
                    text: '인버터 발전량 kWh',
                    color: '#000',
                  },
                  min: 0,
                  max: 20000,
                  ticks: { stepSize: 200, color: '#000' },
                  grid: { drawOnChartArea: true, color: 'rgba(0,0,0,0.1)' },
                },
                yRight: {
                  type: 'linear',
                  display: true,
                  position: 'right',
                  title: { display: true, text: '온도 °C', color: '#000' }, // 온도 단위 추가
                  min: 0,
                  max: 100,
                  ticks: {
                    stepSize: 10,
                    color: '#000',
                    callback: (value: any) => Number(value).toFixed(0),
                  },
                  grid: { drawOnChartArea: false },
                },
              },
            },
          };

          let arrayUpperList: number[] = [];
          let arrayMiddleList: number[] = [];
          let arrayLowerList: number[] = [];
          let ambientUpperList: number[] = [];
          let ambientMiddleList: number[] = [];
          let ambientLowerList: number[] = [];

          if (gbn === 'time') {
            this.gbn = 'time';
            chartObject.data.labels = [
              '00시',
              '01시',
              '02시',
              '03시',
              '04시',
              '05시',
              '06시',
              '07시',
              '08시',
              '09시',
              '10시',
              '11시',
              '12시',
              '13시',
              '14시',
              '15시',
              '16시',
              '17시',
              '18시',
              '19시',
              '20시',
              '21시',
              '22시',
              '23시',
            ];

            // Inverter: group by inverterId (or id) and map to 24hr series
            const invValueKey = inverterData.length
              ? this.firstNumberKey(inverterData[0], [
                  'powerGeneration',
                  'generation',
                  'value',
                  'kwh',
                  'energy',
                  'power',
                ]) || 'powerGeneration' // Node 14 호환
              : 'powerGeneration';
            const byId: Record<string, any[]> = {};
            for (const row of inverterData) {
              // Node 14 호환: ?? 대신 || 사용
              const id = String(
                row.insNum || row.inverterId || row.id || 'INV'
              );
              (byId[id] = byId[id] || []).push(row);
            }
            for (const id of Object.keys(byId)) {
              const series = this.buildHourSeries(byId[id], [
                invValueKey,
                'value',
              ]);
              chartObject.data.datasets.push({
                label: `인버터 ${id}`,
                data: series,
                borderColor: 'rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                yAxisID: 'yLeftMain',
                type: 'line',
              });
              this.tableHeadData.push('인버터 발전량 (kWh)');
              this.tableData.push(this.formatPowerData(series)); // 인버터 데이터는 kWh로 포맷
            }

            // Temperature series for 24hr format - 각각 다른 키 사용
            arrayUpperList = this.buildHourSeries(arrayUpper, ['temperature1']); // 어레이 온도는 temperature1만
            arrayMiddleList = this.buildHourSeries(arrayMiddle, [
              'temperature1',
            ]); // 어레이 온도는 temperature1만
            arrayLowerList = this.buildHourSeries(arrayLower, ['temperature1']); // 어레이 온도는 temperature1만
            ambientUpperList = this.buildHourSeries(ambientUpper, [
              'temperature2',
            ]); // 어레이 주변은 temperature2만
            ambientMiddleList = this.buildHourSeries(ambientMiddle, [
              'temperature2',
            ]); // 어레이 주변은 temperature2만
            ambientLowerList = this.buildHourSeries(ambientLower, [
              'temperature2',
            ]); // 어레이 주변은 temperature2만
          } else if (gbn === 'day' || gbn === 'month') {
            if (gbn === 'day') {
              this.gbn = 'day';
              const sd = moment(this.startDate).format('YYYY-MM-DD');
              const ed = moment(this.endDate).format('YYYY-MM-DD');
              this.dateList = this.getDatesStartToLast(sd, ed);
            } else {
              this.gbn = 'month';
              const sm = moment(this.startMonthDate).format('YYYY-MM');
              const em = moment(this.endMonthDate).format('YYYY-MM');
              this.dateList = this.getMonthDatesStartToLast(sm, em);
            }
            chartObject.data.labels = this.dateList;
            this.tableDayData = this.dateList;

            // Inverter for day/month
            const invValKey = inverterData.length
              ? this.firstNumberKey(inverterData[0], [
                  'powerGeneration',
                  'generation',
                  'value',
                  'kwh',
                  'energy',
                  'power',
                ]) || 'powerGeneration' // Node 14 호환
              : 'powerGeneration';
            const invLabelKey =
              inverterData[0] && 'date' in inverterData[0]
                ? 'date'
                : 'timePeriod';
            const byId: Record<string, any[]> = {};
            for (const row of inverterData) {
              // Node 14 호환: ?? 대신 || 사용
              const id = String(
                row.insNum || row.inverterId || row.id || '인버터'
              );
              (byId[id] = byId[id] || []).push(row);
            }
            for (const id of Object.keys(byId)) {
              const series = this.buildSeriesByLabels(
                byId[id],
                this.dateList,
                [
                  invValKey,
                  'powerGeneration',
                  'value',
                  'generation',
                  'kwh',
                  'energy',
                  'power',
                ],
                invLabelKey
              );
              chartObject.data.datasets.push({
                label: id,
                data: series,
                borderColor: 'rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                yAxisID: 'yLeftMain',
                type: 'line',
              });
              this.tableHeadData.push('인버터 발전량 (kWh)');
              this.tableData.push(this.formatPowerData(series)); // 인버터 데이터는 kWh로 포맷
            }

            // Temperature series mapped to date/month labels - 각각 다른 키 사용
            const tempLabelGuess =
              arrayUpper[0] && 'date' in arrayUpper[0] ? 'date' : 'timePeriod';

            arrayUpperList = this.buildSeriesByLabels(
              arrayUpper,
              this.dateList,
              ['temperature1'], // 어레이 온도는 temperature1만
              tempLabelGuess
            );
            arrayMiddleList = this.buildSeriesByLabels(
              arrayMiddle,
              this.dateList,
              ['temperature1'], // 어레이 온도는 temperature1만
              tempLabelGuess
            );
            arrayLowerList = this.buildSeriesByLabels(
              arrayLower,
              this.dateList,
              ['temperature1'], // 어레이 온도는 temperature1만
              tempLabelGuess
            );
            ambientUpperList = this.buildSeriesByLabels(
              ambientUpper,
              this.dateList,
              ['temperature2'], // 어레이 주변은 temperature2만
              tempLabelGuess
            );
            ambientMiddleList = this.buildSeriesByLabels(
              ambientMiddle,
              this.dateList,
              ['temperature2'], // 어레이 주변은 temperature2만
              tempLabelGuess
            );
            ambientLowerList = this.buildSeriesByLabels(
              ambientLower,
              this.dateList,
              ['temperature2'], // 어레이 주변은 temperature2만
              tempLabelGuess
            );
          }

          // Add the 6 temperature lines
          chartObject.data.datasets.push({
            label: '어레이 상부',
            data: arrayUpperList,
            borderColor: 'rgba(255,99,132,0.8)',
            backgroundColor: 'rgba(255,99,132,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          });
          chartObject.data.datasets.push({
            label: '어레이 중부',
            data: arrayMiddleList,
            borderColor: 'rgba(75,192,134,0.8)',
            backgroundColor: 'rgba(75,192,134,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          });
          chartObject.data.datasets.push({
            label: '어레이 하부',
            data: arrayLowerList,
            borderColor: 'rgba(54,162,235,0.8)',
            backgroundColor: 'rgba(54,162,235,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          });
          chartObject.data.datasets.push({
            label: '어레이 상부 주변',
            data: ambientUpperList,
            borderColor: 'rgba(153,102,255,0.8)',
            backgroundColor: 'rgba(153,102,255,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          });
          chartObject.data.datasets.push({
            label: '어레이 중부 주변',
            data: ambientMiddleList,
            borderColor: 'rgba(255,159,64,0.8)',
            backgroundColor: 'rgba(255,159,64,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          });
          chartObject.data.datasets.push({
            label: '어레이 하부 주변',
            data: ambientLowerList,
            borderColor: 'rgba(255,205,86,0.8)',
            backgroundColor: 'rgba(255,205,86,0.8)',
            yAxisID: 'yRight',
            type: 'line',
          });

          // Table entries for temperatures - 온도 데이터는 °C로 포맷
          this.tableHeadData.push(
            '어레이 상부 (°C)',
            '어레이 중부 (°C)',
            '어레이 하부 (°C)',
            '어레이 상부 주변 (°C)',
            '어레이 중부 주변 (°C)',
            '어레이 하부 주변 (°C)'
          );
          this.tableData.push(
            this.formatTemperatureData(arrayUpperList), // °C로 포맷
            this.formatTemperatureData(arrayMiddleList), // °C로 포맷
            this.formatTemperatureData(arrayLowerList), // °C로 포맷
            this.formatTemperatureData(ambientUpperList), // °C로 포맷
            this.formatTemperatureData(ambientMiddleList), // °C로 포맷
            this.formatTemperatureData(ambientLowerList) // °C로 포맷
          );

          console.log('Chart Object:', chartObject);
          console.log('Table Data:', this.tableData);
          console.log('Table Head:', this.tableHeadData);

          this.chart = new Chart(this.chartRef.nativeElement, chartObject);
        },
        error: (err) => {
          console.error('Error fetching temperature data:', err);
        },
      });
  }

  getDatesStartToLast(startDate: string, lastDate: string) {
    const regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
    if (!(regex.test(startDate) && regex.test(lastDate)))
      return 'Not Date Format';
    const result: string[] = [];
    const curDate = new Date(startDate);
    while (curDate <= new Date(lastDate)) {
      result.push(curDate.toISOString().split('T')[0]);
      curDate.setDate(curDate.getDate() + 1);
    }
    return result;
  }

  getMonthDatesStartToLast(startDate: string, lastDate: string) {
    const regex = RegExp(/^\d{4}-(0[1-9]|1[012])$/);
    if (!(regex.test(startDate) && regex.test(lastDate)))
      return 'Not Date Format';
    const result: string[] = [];
    const curDate = new Date(startDate);
    while (curDate <= new Date(lastDate)) {
      result.push(moment(curDate).format('YYYY-MM'));
      curDate.setMonth(curDate.getMonth() + 1);
    }
    return result;
  }

  downloadToExcel(name: string) {
    const tableList = Array.prototype.map.call(
      document.querySelectorAll('#table tr'),
      function (tr: any) {
        return Array.prototype.map.call(
          tr.querySelectorAll('td'),
          function (td: any) {
            return td.innerHTML;
          }
        );
      }
    );

    const { sheetName, fileName } = this.getFileName(name);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(tableList);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  getFileName(name: string) {
    const timeSpan = new Date().toISOString();
    const sheetName = name || 'ExportResult';
    const fileName = `${sheetName}-${timeSpan}`;
    return { sheetName, fileName };
  }

  changeValue(value: any) {
    this.insNum = value;
    console.log('Selected inverter:', this.insNum);
  }
}
