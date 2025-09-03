import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { SemsService } from '../../../services/sems-service';
import { Chart, registerables } from 'chart.js';
import moment from 'moment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-use-rate',
  templateUrl: './use-rate.component.html',
  styleUrls: ['./use-rate.component.scss'],
})
export class UseRateComponent implements OnInit, AfterViewInit {
  @ViewChild('chart_use_rate', { static: true }) chart;

  colorArray: any = [
    'rgba(54, 162, 235, 0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(75,192,134,0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(104,110,110,0.8)',
    'rgba(154,235,54,0.8)',
    'rgba(236,111,227,0.8)',
  ];

  colorArrayRev: any = [
    'rgba(236,111,227,0.8)',
    'rgba(154,235,54,0.8)',
    'rgba(104,110,110,0.8)',
    'rgba(255, 205, 86, 0.8)',
    'rgba(153, 102, 255, 0.8)',
    'rgba(255, 159, 64, 0.8)',
    'rgba(75,192,134,0.8)',
    'rgba(255, 99, 132, 0.8)',
    'rgba(54, 162, 235, 0.8)',
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

  tableHeadData: any[] = [];
  tableDayData: any[] = [];
  tableData: any[] = [];
  gbn: 'time' | 'day' | 'month' | '' = '';
  dateList: string[] = [];

  constructor(private semsService: SemsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.radio_input1_click();
    this.createChart();
  }
  ngAfterViewInit(): void {}

  /** Used by the template to check emptiness safely */
  isNonZero(v: any): boolean {
    const n = Number(v);
    return Number.isFinite(n) && n !== 0;
  }

  /** Format number to up to 6 decimals (usage rates) */
  private toFixed6(n: any) {
    const num = Number(n);
    return Number.isFinite(num) ? Number(num.toFixed(6)) : 0;
  }

  /** Build a sparse x-axis to prevent tall bottom area when labels are many */
  private buildXAxis(labels: string[]) {
    const step = Math.max(1, Math.ceil(labels.length / 12)); // render ~12 labels
    return {
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        callback: (_: any, index: number) =>
          index % step === 0 ? labels[index] : '',
      },
      grid: { drawTicks: true },
    };
  }

  /** Canvas width scales with label count → scroll horizontally instead of shrinking */
  private sizeCanvasToLabels(labels: string[]) {
    const perLabelPx = 70; // size label in chart
    const minWidthPx = 900;
    const canvasEl = document.getElementById(
      'chart_use_rate'
    ) as HTMLCanvasElement | null;
    if (!canvasEl) return;
    const targetWidth = Math.max(minWidthPx, labels.length * perLabelPx);
    canvasEl.style.width = `${targetWidth}px`; // height is locked in CSS
  }

  /** Average by column across arrays, keeping 6 decimals */
  private averageColumns(lists: number[]): number[];
  private averageColumns(lists: number[][]): number[];
  private averageColumns(lists: any): number[] {
    const arrs: number[][] = lists ?? [];
    const maxLength = arrs.length ? Math.max(...arrs.map((l) => l.length)) : 0;
    return Array.from({ length: maxLength }, (_, idx) => {
      let sum = 0;
      let count = 0;
      for (const list of arrs) {
        const v = Number(list[idx]);
        if (!Number.isNaN(v)) {
          sum += v;
          count += 1;
        }
      }
      return count ? this.toFixed6(sum / count) : 0;
    });
  }

  /** Normalizers keep inbound data aligned with headers */
  private normHour(tp: any): number | null {
    const m = String(tp).match(/\d{1,2}/);
    if (!m) return null;
    const h = parseInt(m[0], 10);
    return h >= 0 && h <= 23 ? h : null;
  }
  private normDay(tp: any): string {
    const d = moment(
      tp,
      [
        moment.ISO_8601,
        'YYYY-MM-DD',
        'YYYY-M-D',
        'YYYY/MM/DD',
        'YYYY/M/D',
        'YYYY.MM.DD',
        'YYYY.M.D',
        'MMM D, YYYY',
        'MMMM D, YYYY',
      ],
      true
    );
    return d.isValid() ? d.format('YYYY-MM-DD') : String(tp);
  }
  private normMonth(tp: any): string {
    let mth = moment(
      tp,
      ['YYYY-MM', 'YYYY-M', 'YYYY/MM', 'YYYY/M', 'YYYY.MM', 'YYYY.M'],
      true
    );
    if (!mth.isValid())
      mth = moment(
        tp,
        [moment.ISO_8601, 'YYYY-MM-DD', 'YYYY/M/D', 'YYYY.M.D'],
        true
      );
    return mth.isValid() ? mth.format('YYYY-MM') : String(tp);
  }

  createChart() {
    this.chart = new Chart('chart_use_rate', {
      type: 'line',
      data: {
        labels: Array.from(
          { length: 24 },
          (_, i) => `${i.toString().padStart(2, '0')}시`
        ),
        datasets: [
          {
            label: '이용률',
            data: [],
            borderColor: 'rgba(255, 159, 64, 0.8)',
            backgroundColor: 'rgba(255, 159, 64, 0.8)',
            yAxisID: 'y2',
            type: 'line',
          },
          {
            label: '전체 이용률',
            data: [],
            borderColor: 'rgba(153, 102, 255, 0.8)',
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
            yAxisID: 'y3',
            type: 'line',
          },
          {
            label: '발전량',
            data: [],
            borderColor: 'rgba(54, 162, 235, 0.8)',
            backgroundColor: 'rgba(54, 162, 235, 0.8)',
            yAxisID: 'y1',
            type: 'bar',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        aspectRatio: undefined as any,
        plugins: {
          tooltip: {
            callbacks: {
              label: (context) => {
                let label = context.dataset.label
                  ? `${context.dataset.label}: `
                  : '';
                const y = context.parsed.y;
                if (y == null) return label;
                if (String(context.dataset.label).includes('이용률'))
                  return label + this.toFixed6(y) + ' %';
                return label + y + ' kWh';
              },
            },
          },
        },
        scales: {
          x: this.buildXAxis(
            Array.from(
              { length: 24 },
              (_, i) => `${i.toString().padStart(2, '0')}시`
            )
          ),
          y1: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: '발전량 kWh',
              color: 'rgba(54, 162, 235, 0.8)',
            },
            position: 'left',
          },
          y2: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: '이용률%',
              color: 'rgba(153, 102, 255, 0.8)',
            },
            position: 'right',
          },
        },
      },
    });
    this.sizeCanvasToLabels(this.chart.data.labels as string[]);
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
    document.getElementById('date_start')!.style.display = 'flex';
    document.getElementById('date_space')!.style.display = 'flex';
    document.getElementById('date_end')!.style.display = 'flex';
    document.getElementById('date_start_month')!.style.display = 'none';
    document.getElementById('date_end_month')!.style.display = 'none';
  }
  radio_input3_click() {
    (document.getElementById('radio_month') as HTMLInputElement).checked = true;
    document.getElementById('date_start')!.style.display = 'none';
    document.getElementById('date_space')!.style.display = 'flex';
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

    this.semsService.getAnalyzeUseRateInfo(gbn, startDate, endDate).subscribe(
      (raw) => {
        const res = raw ?? {};
        const invData: any[] = Array.isArray(res?.inverterGenerationData)
          ? res.inverterGenerationData
          : [];
        const useData: any[] = Array.isArray(res?.usageRateData)
          ? res.usageRateData
          : [];

        // Reset table & chart
        this.tableHeadData = [];
        this.tableData = [];
        if (this.chart && typeof this.chart.destroy === 'function')
          this.chart.destroy();

        const chartObject: any = {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: {
            maintainAspectRatio: false,
            aspectRatio: undefined as any,
            plugins: {
              tooltip: {
                callbacks: {
                  label: (context) => {
                    let label = context.dataset.label
                      ? `${context.dataset.label}: `
                      : '';
                    const y = context.parsed.y;
                    if (y == null) return label;
                    if (String(context.dataset.label).includes('이용률'))
                      return label + this.toFixed6(y) + ' %';
                    return label + y + ' kWh';
                  },
                },
              },
            },
            scales: {
              x: undefined, // set below per mode
              y1: {
                type: 'linear',
                display: true,
                title: {
                  display: true,
                  text: '발전량 kWh',
                  color: 'rgba(54, 162, 235, 0.8)',
                },
                position: 'left',
              },
              y2: {
                type: 'linear',
                display: true,
                title: {
                  display: true,
                  text: '이용률%',
                  color: 'rgba(153, 102, 255, 0.8)',
                },
                position: 'right',
              },
            },
          },
        };

        // Map insNum -> displayName
        const nameByIns: Record<string, string> = {};
        for (const r of invData)
          if (r?.insNum) nameByIns[r.insNum] = r.inverterName || r.insNum;

        if (gbn === 'time') {
          this.gbn = 'time';
          chartObject.data.labels = Array.from(
            { length: 24 },
            (_, i) => `${i.toString().padStart(2, '0')}시`
          );
          chartObject.options.scales.x = this.buildXAxis(
            chartObject.data.labels
          );

          const titleSet = new Set<string>();
          invData.forEach((d) =>
            titleSet.add(d?.inverterName || d?.insNum || '')
          );
          useData.forEach((d) =>
            titleSet.add(nameByIns[d?.insNum] || d?.insNum || '')
          );
          const titleList = Array.from(titleSet).filter(Boolean);

          const invObject: Record<string, number[]> = {};
          const useRateObject: Record<string, number[]> = {};
          for (const t of titleList) {
            invObject[t] = new Array(24).fill(0);
            useRateObject[t] = new Array(24).fill(0);
          }

          for (const r of invData) {
            const hour = this.normHour(r?.timePeriod);
            if (hour == null) continue;
            const title = r?.inverterName || r?.insNum;
            if (!title) continue;
            invObject[title][hour] = Number(r?.powerGeneration) || 0;
          }
          for (const r of useData) {
            const hour = this.normHour(r?.timePeriod);
            if (hour == null) continue;
            const title = nameByIns[r?.insNum] || r?.insNum;
            if (!title) continue;
            useRateObject[title][hour] = this.toFixed6(r?.usageRate); // percent already
          }

          Object.keys(invObject).forEach((key, i) => {
            this.tableHeadData.push(`${key} 발전량`);
            this.tableData.push(invObject[key]);
            chartObject.data.datasets.push({
              label: `${key} 발전량`,
              data: invObject[key],
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              yAxisID: 'y1',
              type: 'bar',
            });
          });

          const avgList = this.averageColumns(Object.values(useRateObject));
          useRateObject['전체(평균)'] = avgList;

          Object.keys(useRateObject).forEach((key, i) => {
            this.tableHeadData.push(`${key} 이용률`);
            this.tableData.push(useRateObject[key]);
            chartObject.data.datasets.push({
              label: `${key} 이용률`,
              data: useRateObject[key],
              borderColor: this.colorArrayRev[i % this.colorArrayRev.length],
              backgroundColor:
                this.colorArrayRev[i % this.colorArrayRev.length],
              yAxisID: 'y2',
              type: 'line',
            });
          });
        } else {
          // Day or Month
          if (gbn === 'day') {
            this.gbn = 'day';
            const s = moment(this.startDate).format('YYYY-MM-DD');
            const e = moment(this.endDate).format('YYYY-MM-DD');
            this.dateList = this.getDatesStartToLast(s, e); // display: YYYY.MM.DD
          } else {
            this.gbn = 'month';
            const s = moment(this.startMonthDate).format('YYYY-MM');
            const e = moment(this.endMonthDate).format('YYYY-MM');
            this.dateList = this.getMonthDatesStartToLast(s, e); // display: YYYY.MM
          }
          chartObject.data.labels = this.dateList;
          chartObject.options.scales.x = this.buildXAxis(this.dateList);
          this.tableDayData = this.dateList;

          // Build index map using canonical keys so inbound data aligns exactly
          const idxByLabel = new Map<string, number>();
          if (gbn === 'day') {
            this.dateList.forEach((lbl: string, i: number) =>
              idxByLabel.set(this.normDay(lbl), i)
            ); // 'YYYY.MM.DD' -> 'YYYY-MM-DD'
          } else {
            this.dateList.forEach((lbl: string, i: number) =>
              idxByLabel.set(this.normMonth(lbl), i)
            ); // 'YYYY.MM' -> 'YYYY-MM'
          }

          const titleSet = new Set<string>();
          invData.forEach((d) =>
            titleSet.add(d?.inverterName || d?.insNum || '')
          );
          useData.forEach((d) =>
            titleSet.add(nameByIns[d?.insNum] || d?.insNum || '')
          );
          const titleList = Array.from(titleSet).filter(Boolean);

          const invObject: Record<string, number[]> = {};
          const useRateObject: Record<string, number[]> = {};
          for (const t of titleList) {
            invObject[t] = this.dateList.map(() => 0);
            useRateObject[t] = this.dateList.map(() => 0);
          }

          for (const r of invData) {
            const canon =
              gbn === 'day'
                ? this.normDay(r?.timePeriod)
                : this.normMonth(r?.timePeriod);
            const idx = idxByLabel.get(canon);
            if (idx == null) continue;
            const title = r?.inverterName || r?.insNum;
            if (!title) continue;
            invObject[title][idx] = Number(r?.powerGeneration) || 0;
          }
          for (const r of useData) {
            const canon =
              gbn === 'day'
                ? this.normDay(r?.timePeriod)
                : this.normMonth(r?.timePeriod);
            const idx = idxByLabel.get(canon);
            if (idx == null) continue;
            const title = nameByIns[r?.insNum] || r?.insNum;
            if (!title) continue;
            useRateObject[title][idx] = this.toFixed6(r?.usageRate); // percent
          }

          Object.keys(invObject).forEach((key, i) => {
            this.tableHeadData.push(`${key} 발전량`);
            this.tableData.push(invObject[key]);
            chartObject.data.datasets.push({
              label: `${key} 발전량`,
              data: invObject[key],
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              yAxisID: 'y1',
              type: 'bar',
            });
          });

          const avgList = this.averageColumns(Object.values(useRateObject));
          useRateObject['전체(평균)'] = avgList;

          Object.keys(useRateObject).forEach((key, i) => {
            this.tableHeadData.push(`${key} 이용률`);
            this.tableData.push(useRateObject[key]);
            chartObject.data.datasets.push({
              label: `${key} 이용률`,
              data: useRateObject[key],
              borderColor: this.colorArrayRev[i % this.colorArrayRev.length],
              backgroundColor:
                this.colorArrayRev[i % this.colorArrayRev.length],
              yAxisID: 'y2',
              type: 'line',
            });
          });
        }

        const labels = chartObject.data.labels as string[];
        this.sizeCanvasToLabels(labels);
        this.chart = new Chart('chart_use_rate', chartObject);
      },
      (err) => {
        console.error('getAnalyzeUseRateInfo error:', err);
        this.tableHeadData = [];
        this.tableData = [];
      }
    );
  }

  // Daily list (display in Korean: YYYY.MM.DD, local time)
  getDatesStartToLast(startDate: string, lastDate: string) {
    const regex = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!(regex.test(startDate) && regex.test(lastDate))) return [];

    const result: string[] = [];
    let cur = moment(startDate, 'YYYY-MM-DD', true);
    const end = moment(lastDate, 'YYYY-MM-DD', true);
    if (!cur.isValid() || !end.isValid()) return [];

    while (cur.isSameOrBefore(end, 'day')) {
      result.push(cur.format('YYYY.MM.DD')); // display
      cur = cur.clone().add(1, 'day');
    }
    return result;
  }

  // Monthly list (display in Korean: YYYY.MM, local time)
  getMonthDatesStartToLast(startDate: string, lastDate: string) {
    const regex = /^\d{4}-(0[1-9]|1[012])$/;
    if (!(regex.test(startDate) && regex.test(lastDate))) return [];

    const result: string[] = [];
    let cur = moment(startDate, 'YYYY-MM', true).startOf('month');
    const end = moment(lastDate, 'YYYY-MM', true).startOf('month');
    if (!cur.isValid() || !end.isValid()) return [];

    while (cur.isSameOrBefore(end, 'month')) {
      result.push(cur.format('YYYY.MM')); // display
      cur = cur.clone().add(1, 'month');
    }
    return result;
  }

  downloadToExcel(name: string) {
    const tableList = Array.prototype.map.call(
      document.querySelectorAll('#table tr'),
      (tr: HTMLTableRowElement) =>
        Array.prototype.map.call(
          tr.querySelectorAll('td'),
          (td: HTMLTableCellElement) => td.innerHTML
        )
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
}
