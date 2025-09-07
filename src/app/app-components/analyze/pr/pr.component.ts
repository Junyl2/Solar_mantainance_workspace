import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { SemsService } from '../../../services/sems-service';
import { Chart, registerables } from 'chart.js';
import moment from 'moment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-pr',
  templateUrl: './pr.component.html',
  styleUrls: ['./pr.component.scss'],
})
export class PrComponent implements OnInit, AfterViewInit {
  @ViewChild('chart_pr', { static: true })
  chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;

  // dates
  startDate: Date = new Date();
  endDate: Date = new Date();
  startMonthDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  private tempMonthDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );
  endMonthDate: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    this.tempMonthDate.getDate()
  );

  // table
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
    this.createEmptyChart();
  }
  ngAfterViewInit(): void {}

  /** ===== Utilities ===== */
  private isNumber(v: any): boolean {
    return v !== null && v !== undefined && !isNaN(+v);
  }
  isEnvRow(label: string): boolean {
    return ['온도', '습도', '풍속', '일사량'].includes(label);
  }

  /** Distinct palettes for two groups (no overlap) */
  private genPalette(
    n: number,
    opts: { hueStart: number; hueStep?: number; s: number; l: number }
  ): string[] {
    if (n <= 0) return [];
    const step = opts.hueStep ?? Math.max(8, Math.floor(360 / Math.max(1, n)));
    const out: string[] = [];
    for (let i = 0; i < n; i++) {
      const hue = (opts.hueStart + i * step) % 360;
      out.push(`hsl(${hue}deg, ${opts.s}%, ${opts.l}%)`);
    }
    return out;
  }

  private createEmptyChart() {
    const cfg: any = {
      type: 'bar',
      data: {
        labels: Array.from(
          { length: 24 },
          (_, i) => (i < 10 ? `0${i}` : `${i}`) + '시'
        ),
        datasets: [],
      },
      options: {
        aspectRatio: 2.5,
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              filter: (item) => !/\(bar\)$/.test(item.text),
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx: any) => {
                // strip " (bar)" from tooltip label
                const base = String(ctx.dataset.label || '').replace(
                  /\s*\(bar\)$/,
                  ''
                );
                const y = ctx.parsed.y;
                if (ctx.dataset.yAxisID === 'y2') return `${base}: ${y}%`;
                return `${base}: ${y} kWh`;
              },
            },
          },
        },

        scales: {
          y1: {
            type: 'linear',
            position: 'left',
            title: { display: true, text: '발전량 kWh' },
          },
          y2: {
            type: 'linear',
            position: 'right',
            title: { display: true, text: 'PR %' },
            grid: { drawOnChartArea: false },
            min: 0,
          },
          x: { ticks: { autoSkip: false, maxRotation: 0 } },
        },
        datasets: {
          bar: {
            // global bar settings for readability
            categoryPercentage: 0.8,
            barPercentage: 0.8,
          },
        },
      },
    };
    this.chart = new Chart(this.chartCanvas.nativeElement, cfg);
  }

  /** ===== Radios / Date pickers ===== */
  radio_input1_click() {
    (document.getElementById('radio_time') as HTMLInputElement).checked = true;
    (document.getElementById('date_start') as HTMLElement).style.display =
      'flex';
    (document.getElementById('date_space') as HTMLElement).style.display =
      'none';
    (document.getElementById('date_end') as HTMLElement).style.display = 'none';
    (document.getElementById('date_start_month') as HTMLElement).style.display =
      'none';
    (document.getElementById('date_end_month') as HTMLElement).style.display =
      'none';
  }
  radio_input2_click() {
    (document.getElementById('radio_day') as HTMLInputElement).checked = true;
    (document.getElementById('date_space') as HTMLElement).style.display =
      'flex';
    (document.getElementById('date_start') as HTMLElement).style.display =
      'flex';
    (document.getElementById('date_end') as HTMLElement).style.display = 'flex';
    (document.getElementById('date_start_month') as HTMLElement).style.display =
      'none';
    (document.getElementById('date_end_month') as HTMLElement).style.display =
      'none';
  }
  radio_input3_click() {
    (document.getElementById('radio_month') as HTMLInputElement).checked = true;
    (document.getElementById('date_space') as HTMLElement).style.display =
      'flex';
    (document.getElementById('date_start') as HTMLElement).style.display =
      'none';
    (document.getElementById('date_end') as HTMLElement).style.display = 'none';
    (document.getElementById('date_start_month') as HTMLElement).style.display =
      'flex';
    (document.getElementById('date_end_month') as HTMLElement).style.display =
      'flex';
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

  /** ===== Main search ===== */
  search_click() {
    let gbn: 'time' | 'day' | 'month' = 'time';
    let startDate: string;
    let endDate: string;

    const isTime = (document.getElementById('radio_time') as HTMLInputElement)
      .checked;
    const isDay = (document.getElementById('radio_day') as HTMLInputElement)
      .checked;

    if (isTime) {
      gbn = 'time';
      startDate = moment(this.startDate).format('YYYYMMDD');
      endDate = moment(this.startDate).add(1, 'days').format('YYYYMMDD');
    } else if (isDay) {
      gbn = 'day';
      startDate = moment(this.startDate).format('YYYYMMDD');
      endDate = moment(this.endDate).add(1, 'days').format('YYYYMMDD');
    } else {
      gbn = 'month';
      startDate = moment(this.startMonthDate).format('YYYYMMDD');
      endDate = moment(this.endMonthDate).add(1, 'days').format('YYYYMMDD');
    }

    this.semsService
      .getAnalyzePrInfo(gbn, startDate, endDate)
      .subscribe((res) => {
        // Reset table + state
        this.tableHeadData = [];
        this.tableData = [];
        this.gbn = gbn;

        const cfg: any = {
          type: 'bar',
          data: { labels: [], datasets: [] },
          options: {
            aspectRatio: 2.5,
            responsive: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
              legend: {
                position: 'top',
                labels: {
                  filter: (item) => !/\(bar\)$/.test(item.text),
                },
              },
              tooltip: {
                callbacks: {
                  label: (ctx: any) => {
                    // strip " (bar)" from tooltip label
                    const base = String(ctx.dataset.label || '').replace(
                      /\s*\(bar\)$/,
                      ''
                    );
                    const y = ctx.parsed.y;
                    if (ctx.dataset.yAxisID === 'y2') return `${base}: ${y}%`;
                    return `${base}: ${y} kWh`;
                  },
                },
              },
            },

            scales: {
              y1: {
                type: 'linear',
                position: 'left',
                title: { display: true, text: '발전량 kWh' },
              },
              y2: {
                type: 'linear',
                position: 'right',
                title: { display: true, text: 'PR %' },
                grid: { drawOnChartArea: false },
                min: 0,
              },
              x: { ticks: { autoSkip: false, maxRotation: 0 } },
            },
          },
        };

        // Labels
        if (gbn === 'time') {
          cfg.data.labels = Array.from(
            { length: 24 },
            (_, i) => (i < 10 ? `0${i}` : `${i}`) + '시'
          );
          // keep a synthetic list to reuse indexing logic
          this.dateList = cfg.data.labels.map((l) => l.replace('시', ''));
        } else if (gbn === 'day') {
          const s = moment(this.startDate).format('YYYY-MM-DD');
          const e = moment(this.endDate).format('YYYY-MM-DD');
          this.dateList = this.getDatesStartToLast(s, e);
          cfg.data.labels = this.dateList.slice();
        } else {
          const s = moment(this.startMonthDate).format('YYYY-MM');
          const e = moment(this.endMonthDate).format('YYYY-MM');
          this.dateList = this.getMonthDatesStartToLast(s, e);
          cfg.data.labels = this.dateList.slice();
        }

        // Build UNION of titles from both res[0] (gen) and res[1] (PR)
        const titleSet = new Set<string>();
        for (const r of res?.[0] ?? []) titleSet.add(String(r[1]));
        for (const r of res?.[1] ?? []) titleSet.add(String(r[1]));
        const titles = Array.from(titleSet);

        // Prepare series containers for ALL titles
        const count = cfg.data.labels.length;
        const invObj: Record<string, number[]> = {};
        const prObj: Record<string, number[]> = {};
        titles.forEach((t) => {
          invObj[t] = Array(count).fill(0);
          prObj[t] = Array(count).fill(0);
        });

        // Index resolver
        const resolveIndex = (x: any): number => {
          if (gbn === 'time') {
            const num = parseInt(String(x), 10);
            return Number.isFinite(num) && num >= 0 && num < count ? num : -1;
          }
          const key = String(x);
          return this.dateList.indexOf(key);
        };

        // Fill 발전량
        for (const r of res?.[0] ?? []) {
          const idx = resolveIndex(r[0]);
          const t = String(r[1]);
          if (idx >= 0 && this.isNumber(r[2]) && invObj[t])
            invObj[t][idx] = +r[2];
        }

        // Fill PR
        for (const r of res?.[1] ?? []) {
          const idx = resolveIndex(r[0]);
          const t = String(r[1]);
          if (idx >= 0 && this.isNumber(r[2]) && prObj[t])
            prObj[t][idx] = +r[2];
        }

        // Compute 전체 PR as sum of individual PR series
        const prLists = Object.keys(prObj).map((k) => prObj[k]);
        const total = Array.from({ length: count }, (_, i) =>
          prLists.reduce(
            (acc, arr) => Math.round((acc + (arr[i] ?? 0)) * 1e6) / 1e6,
            0
          )
        );
        prObj['전체'] = total;

        // Colors (no overlap between power-gen vs PR)
        const barColorsPower = this.genPalette(titles.length, {
          hueStart: 210,
          s: 70,
          l: 55,
        }); // 발전량
        const prKeys = Object.keys(prObj); // includes '전체'
        const prColors = this.genPalette(prKeys.length, {
          hueStart: 20,
          s: 70,
          l: 45,
        }); // PR bars & lines

        // ===== TABLE + DATASETS ORDER =====
        // 1) All 발전량 (bars) first
        titles.forEach((t, i) => {
          this.tableHeadData.push(`${t} 발전량`);
          this.tableData.push(invObj[t]);

          cfg.data.datasets.push({
            label: `${t} 발전량`,
            data: invObj[t],
            yAxisID: 'y1',
            type: 'bar',
            backgroundColor: barColorsPower[i],
            borderColor: barColorsPower[i],
            borderWidth: 1,
            order: 1, // draw first
            maxBarThickness: 26,
          });
        });

        // 2) PR as BARS (added, thinner bars)
        prKeys.forEach((t, i) => {
          // NOTE: Do not add extra table rows; table already shows PR once (as lines section below).
          cfg.data.datasets.push({
            label: `${t} PR (bar)`,
            data: prObj[t],
            yAxisID: 'y2',
            type: 'bar',
            backgroundColor: prColors[i],
            borderColor: prColors[i],
            borderWidth: 1,
            order: 2, // drawn after power bars
            maxBarThickness: 14, // thinner than power bars for legibility
          });
        });

        // 3) PR as LINES (kept)
        prKeys.forEach((t, i) => {
          this.tableHeadData.push(`${t} PR`);
          this.tableData.push(prObj[t]);

          cfg.data.datasets.push({
            label: `${t} PR`,
            data: prObj[t],
            yAxisID: 'y2',
            type: 'line',
            borderColor: prColors[i],
            backgroundColor: prColors[i],
            tension: 0.3,
            pointRadius: 2,
            borderWidth: 2,
            order: 3, // drawn on top
          });
        });

        // (Re)draw
        if (this.chart) this.chart.destroy();
        this.chart = new Chart(this.chartCanvas.nativeElement, cfg);
      });
  }

  /** Date helpers always return arrays */
  getDatesStartToLast(startDate: string, lastDate: string): string[] {
    const regex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!regex.test(startDate) || !regex.test(lastDate)) return [];
    const result: string[] = [];
    const cur = new Date(startDate);
    const end = new Date(lastDate);
    while (cur <= end) {
      result.push(cur.toISOString().split('T')[0]);
      cur.setDate(cur.getDate() + 1);
    }
    return result;
  }
  getMonthDatesStartToLast(startDate: string, lastDate: string): string[] {
    const regex = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!regex.test(startDate) || !regex.test(lastDate)) return [];
    const result: string[] = [];
    let cur = new Date(startDate + '-01');
    const end = new Date(lastDate + '-01');
    while (cur <= end) {
      result.push(moment(cur).format('YYYY-MM'));
      cur.setMonth(cur.getMonth() + 1);
    }
    return result;
  }

  /** Export table to Excel */
  downloadToExcel(name: string) {
    const rows = Array.prototype.map.call(
      document.querySelectorAll('#table tr'),
      (tr: HTMLTableRowElement) =>
        Array.prototype.map.call(
          tr.querySelectorAll('td'),
          (td: HTMLTableCellElement) => td.innerText
        )
    );
    const { sheetName, fileName } = this.getFileName(name);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }
  private getFileName(name: string) {
    const timeSpan = new Date().toISOString();
    const sheetName = name || 'ExportResult';
    const fileName = `${sheetName}-${timeSpan}`;
    return { sheetName, fileName };
  }
}
