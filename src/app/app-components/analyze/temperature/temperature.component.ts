import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef , ElementRef } from '@angular/core';
import { SemsService } from "../../../services/sems-service";
import { Chart, registerables } from 'chart.js';
import { BreakpointObserver } from '@angular/cdk/layout';
import moment from "moment";
import * as XLSX from "xlsx";

@Component({
  selector: 'app-temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.scss']
})
export class TemperatureComponent implements OnInit, AfterViewInit {
  @ViewChild('chart_temperature', { static: true }) chartRef: ElementRef;

  chart: Chart;
  isMobile = false;
  isTablet = false;

  invList = [];
  colorArray: any = [
    'rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(75,192,134,0.8)',
    'rgba(255, 159, 64, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 205, 86, 0.8)',
    'rgba(201, 203, 207, 0.8)', 'rgba(154,235,54,0.8)', 'rgba(236,111,227,0.8)'
  ];
  startDate: Date = new Date();
  endDate: Date = new Date();
  startMonthDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  tempMonthDate: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  endMonthDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), this.tempMonthDate.getDate());
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

  // ---------- helpers (added) ----------
  private toHourIndex(tp: any): number {
    if (tp == null) return -1;
    const s = String(tp);
    const m = s.match(/\b([01]?\d|2[0-3])\b/);
    if (m) return parseInt(m[1], 10);
    const n = Number(s);
    return (Number.isFinite(n) && n >= 0 && n <= 23) ? n : -1;
  }

  /** pick a numeric value key from a sample row */
  private firstNumberKey(o: any, preferred: string[] = []): string | null {
    if (!o || typeof o !== 'object') return null;
    for (const k of preferred) if (k in o && typeof o[k] === 'number') return k;
    for (const k of Object.keys(o)) {
      if (['timePeriod','date','inverterId','id','name','label'].includes(k)) continue;
      if (typeof o[k] === 'number') return k;
    }
    return null;
  }

  private buildHourSeries(arr: any[], preferredKeys: string[]): number[] {
    const out = new Array(24).fill(0);
    if (!Array.isArray(arr) || arr.length === 0) return out;
    const key = this.firstNumberKey(arr[0], preferredKeys) ?? this.firstNumberKey(arr[0], []);
    if (!key) return out;
    for (const r of arr) {
      const h = this.toHourIndex(r.timePeriod ?? r.hour ?? r.time);
      const v = r[key];
      if (h >= 0 && h < 24 && typeof v === 'number') out[h] = v;
    }
    return out;
  }

  private buildSeriesByLabels(arr: any[], labels: string[], preferredKeys: string[], labelKeyGuess?: string): number[] {
    const out = labels.map(() => 0);
    if (!Array.isArray(arr) || arr.length === 0) return out;
    const valueKey = this.firstNumberKey(arr[0], preferredKeys) ?? this.firstNumberKey(arr[0], []);
    if (!valueKey) return out;
    const labelKey = labelKeyGuess ?? (('date' in arr[0]) ? 'date' : ('timePeriod' in arr[0]) ? 'timePeriod' : null);
    if (!labelKey) return out;

    const map = new Map<string, number>();
    for (const r of arr) {
      const lbl = String(r[labelKey] ?? '');
      const v = r[valueKey];
      if (lbl && typeof v === 'number') map.set(lbl, v);
    }
    return labels.map(l => map.get(l) ?? 0);
  }
  // ---------- end helpers ----------

  updateChartAspectRatio() {
    if (!this.chart) return;
    this.chart.options.aspectRatio = this.isMobile ? 0.6 : this.isTablet ? 1.5 : 2.5;
    this.chart.update();
  }

  ngOnInit(): void {
    this.radio_input1_click();
  }

  ngAfterViewInit(): void {
    this.getAnalyzeTemperatureInvList();

    this.breakpointObserver.observe([
      '(max-width: 767px)',
      '(min-width: 768px) and (max-width: 1024px)'
    ]).subscribe(result => {
      if (result.breakpoints['(max-width: 767px)']) {
        this.isMobile = true;
        this.isTablet = false;
      } else if (result.breakpoints['(min-width: 768px) and (max-width: 1024px)']) {
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
    this.semsService.getAnalyzeTemperatureInvList().subscribe(res => {
      console.log("Original response:", res);
      // Filter only 202 and 204
      const filtered = (res || []).filter((i: any) => i[1] === 202 || i[1] === 204);
      console.log("Filtered list:", filtered);

      setTimeout(() => {
        this.invList = filtered.map((i: any) => ({
          viewValue: i[0],
          value: i[1]
        }));
        console.log("Mapped invList for dropdown:", this.invList);
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
          '00시','01시','02시','03시','04시','05시','06시','07시','08시','09시','10시','11시',
          '12시','13시','14시','15시','16시','17시','18시','19시','20시','21시','22시','23시'
        ],
        datasets: [
          {
            label: '인버터 발전량',
            data: [],
            borderColor: 'rgba(0,0,0,0.8)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            yAxisID: 'yLeftMain',
            type: 'bar'
          },
          {
            label: '모듈 후면',
            data: [],
            borderColor: 'rgba(153,102,255,0.8)',
            backgroundColor: 'rgba(153,102,255,0.8)',
            yAxisID: 'yLeftSecondary',
            type: 'line'
          },
          {
            label: '공기층',
            data: [],
            borderColor: 'rgba(75,192,134,0.8)',
            backgroundColor: 'rgba(75,192,134,0.8)',
            yAxisID: 'yLeftSecondary',
            type: 'line'
          },
          {
            label: '건물면',
            data: [],
            borderColor: 'rgba(54,162,235,0.8)',
            backgroundColor: 'rgba(54,162,235,0.8)',
            yAxisID: 'yRight',
            type: 'line'
          }
        ]
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
            max: 1200,
            ticks: { stepSize: 200, color: '#000' },
            grid: { drawOnChartArea: true, color: 'rgba(0,0,0,0.1)' }
          },
          yLeftSecondary: {
            type: 'linear',
            display: true,
            position: 'left',
            min: -1,
            max: 1,
            ticks: {
              stepSize: 0.2,
              color: '#000',
              callback: (value: any) => Number(value).toFixed(1)
            },
            grid: { drawOnChartArea: false }
          },
          yRight: {
            type: 'linear',
            display: true,
            position: 'right',
            min: 0,
            max: 1,
            ticks: {
              stepSize: 0.1,
              color: '#000',
              callback: (value: any) => Number(value).toFixed(1)
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
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
    this.startMonthDate = new Date(this.startMonthDate.getFullYear(), this.startMonthDate.getMonth(), 1);
    datepicker.close();
  }

  onEndMonthSelected(normalizedYear: any) {
    this.endMonthDate.setFullYear(normalizedYear.year());
  }

  onEndMonthMonthSelected(normalizedMonth: any, datepicker: any) {
    this.endMonthDate.setFullYear(normalizedMonth.year());
    this.endMonthDate.setMonth(normalizedMonth.month());
    const tempDate = new Date(this.endMonthDate.getFullYear(), normalizedMonth.month() + 1, 0);
    this.endMonthDate = new Date(this.endMonthDate.getFullYear(), normalizedMonth.month(), tempDate.getDate());
    datepicker.close();
  }

  search_click() {
    console.log("search_click triggered");
    let gbn: 'time' | 'day' | 'month';
    let startDate: string;
    let endDate: string;

    if ((document.getElementById('radio_time') as HTMLInputElement).checked) {
      gbn = 'time';
      startDate = moment(this.startDate).format('YYYYMMDD');
      endDate   = moment(this.startDate).add(1, 'days').format('YYYYMMDD');
    } else if ((document.getElementById('radio_day') as HTMLInputElement).checked) {
      gbn = 'day';
      startDate = moment(this.startDate).format('YYYYMMDD');
      endDate   = moment(this.endDate).add(1, 'days').format('YYYYMMDD');
    } else {
      gbn = 'month';
      startDate = moment(this.startMonthDate).format('YYYYMMDD');
      endDate   = moment(this.endMonthDate).add(1, 'days').format('YYYYMMDD');
    }

    this.semsService.getAnalyzeTemperatureInfo(gbn, this.insNum.toString(), startDate, endDate).subscribe({
      next: res => {
        console.log("API response:", res);

        const inverterData = res?.inverterGenerationData ?? [];
        const arrayUpper   = res?.arrayUpperData ?? [];
        const arrayMiddle  = res?.arrayMiddleData ?? [];
        const arrayLower   = res?.arrayLowerData ?? [];

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
                title: { display: true, text: '인버터 발전량 kWh', color: '#000' },
                min: 0,
                max: 1200,
                ticks: { stepSize: 200, color: '#000' },
                grid: { drawOnChartArea: true, color: 'rgba(0,0,0,0.1)' }
              },
              yLeftSecondary: {
                type: 'linear',
                display: true,
                position: 'left',
                min: -1,
                max: 1,
                ticks: {
                  stepSize: 0.2,
                  color: '#000',
                  callback: (value: any) => Number(value).toFixed(1)
                },
                grid: { drawOnChartArea: false }
              },
              yRight: {
                type: 'linear',
                display: true,
                position: 'right',
                min: 0,
                max: 1,
                ticks: {
                  stepSize: 0.1,
                  color: '#000',
                  callback: (value: any) => Number(value).toFixed(1)
                },
                grid: { drawOnChartArea: false }
              }
            }
          }
        };

        let temp1List: number[] = [];
        let temp2List: number[] = [];
        let temp3List: number[] = [];

        if (gbn === 'time') {
          this.gbn = 'time';
          chartObject.data.labels = [
            '00시','01시','02시','03시','04시','05시','06시','07시','08시','09시','10시','11시',
            '12시','13시','14시','15시','16시','17시','18시','19시','20시','21시','22시','23시'
          ];

          // Inverter: group by inverterId (or id) and map to 24hr series
          const invValueKey = inverterData.length ? (this.firstNumberKey(inverterData[0], ['generation','value','kwh','energy','power']) ?? 'value') : 'value';
          const byId: Record<string, any[]> = {};
          for (const row of inverterData) {
            const id = (row.inverterId ?? row.id ?? 'INV').toString();
            (byId[id] ||= []).push(row);
          }
          for (const id of Object.keys(byId)) {
            const series = this.buildHourSeries(byId[id], [invValueKey, 'value']);
            chartObject.data.datasets.push({
              label: `인버터 ${id}`,
              data: series,
              borderColor: 'rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              yAxisID: 'yLeftMain',
              type: 'bar'
            });
            this.tableHeadData.push('인버터 발전량');
            this.tableData.push(series);
          }

          // Temps (upper/middle/lower) as lines
          temp1List = this.buildHourSeries(arrayUpper,  ['temperature1','temp1','value','temperature2','temp2']);
          temp2List = this.buildHourSeries(arrayMiddle, ['temperature1','temp1','value','temperature2','temp2']);
          temp3List = this.buildHourSeries(arrayLower,  ['temperature1','temp1','value','temperature2','temp2']);

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
          const invValKey = inverterData.length ? (this.firstNumberKey(inverterData[0], ['generation','value','kwh','energy','power']) ?? 'value') : 'value';
          const invLabelKey = (inverterData[0] && 'date' in inverterData[0]) ? 'date' : 'timePeriod';
          const byId: Record<string, any[]> = {};
          for (const row of inverterData) {
            const id = (row.inverterId ?? row.id ?? '인버터').toString();
            (byId[id] ||= []).push(row);
          }
          for (const id of Object.keys(byId)) {
            const series = this.buildSeriesByLabels(byId[id], this.dateList, [invValKey, 'value','generation','kwh','energy','power'], invLabelKey);
            chartObject.data.datasets.push({
              label: id,
              data: series,
              borderColor: 'rgba(0,0,0,0.8)',
              backgroundColor: 'rgba(0,0,0,0.8)',
              yAxisID: 'yLeftMain',
              type: 'bar'
            });
            this.tableHeadData.push('인버터 발전량');
            this.tableData.push(series);
          }

          // Temps (upper/middle/lower) mapped to date/month labels
          const tempLabelGuess = (arrayUpper[0] && 'date' in arrayUpper[0]) ? 'date' : 'timePeriod';
          temp1List = this.buildSeriesByLabels(arrayUpper,  this.dateList, ['temperature1','temp1','value','temperature2','temp2'], tempLabelGuess);
          temp2List = this.buildSeriesByLabels(arrayMiddle, this.dateList, ['temperature1','temp1','value','temperature2','temp2'], tempLabelGuess);
          temp3List = this.buildSeriesByLabels(arrayLower,  this.dateList, ['temperature1','temp1','value','temperature2','temp2'], tempLabelGuess);
        }

        // Add the 3 temperature lines
        chartObject.data.datasets.push({
          label: '모듈 후면',
          data: temp1List,
          borderColor: 'rgba(153,102,255,0.8)',
          backgroundColor: 'rgba(153,102,255,0.8)',
          yAxisID: 'yLeftSecondary',
          type: 'line'
        });
        chartObject.data.datasets.push({
          label: '공기층',
          data: temp2List,
          borderColor: 'rgba(75,192,134,0.8)',
          backgroundColor: 'rgba(75,192,134,0.8)',
          yAxisID: 'yLeftSecondary',
          type: 'line'
        });
        chartObject.data.datasets.push({
          label: '건물면',
          data: temp3List,
          borderColor: 'rgba(54,162,235,0.8)',
          backgroundColor: 'rgba(54,162,235,0.8)',
          yAxisID: 'yRight',
          type: 'line'
        });

        // Table entries for temps
        this.tableHeadData.push('모듈 후면','공기층','건물면');
        this.tableData.push(temp1List, temp2List, temp3List);

        console.log("Chart Object:", chartObject);
        console.log("Table Data:", this.tableData);
        console.log("Table Head:", this.tableHeadData);

        this.chart = new Chart(this.chartRef.nativeElement, chartObject);
      },
      error: err => {
        console.error("Error fetching temperature data:", err);
      }
    });
  }

  getDatesStartToLast(startDate: string, lastDate: string) {
    const regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
    if (!(regex.test(startDate) && regex.test(lastDate))) return "Not Date Format";
    const result: string[] = [];
    const curDate = new Date(startDate);
    while (curDate <= new Date(lastDate)) {
      result.push(curDate.toISOString().split("T")[0]);
      curDate.setDate(curDate.getDate() + 1);
    }
    return result;
  }

  getMonthDatesStartToLast(startDate: string, lastDate: string) {
    const regex = RegExp(/^\d{4}-(0[1-9]|1[012])$/);
    if (!(regex.test(startDate) && regex.test(lastDate))) return "Not Date Format";
    const result: string[] = [];
    const curDate = new Date(startDate);
    while (curDate <= new Date(lastDate)) {
      result.push(moment(curDate).format('YYYY-MM'));
      curDate.setMonth(curDate.getMonth() + 1);
    }
    return result;
  }

  downloadToExcel(name: string) {
    const tableList = Array.prototype.map.call(document.querySelectorAll('#table tr'), function(tr: any){
      return Array.prototype.map.call(tr.querySelectorAll('td'), function(td: any){
        return td.innerHTML;
      });
    });

    const { sheetName, fileName } = this.getFileName(name);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(tableList);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  getFileName(name: string) {
    const timeSpan = new Date().toISOString();
    const sheetName = name || "ExportResult";
    const fileName = `${sheetName}-${timeSpan}`;
    return { sheetName, fileName };
  }

  changeValue(value: any) {
    this.insNum = value;
    console.log("Selected inverter:", this.insNum);
  }
}
