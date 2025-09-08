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
  selector: 'app-use-rate',
  templateUrl: './use-rate.component.html',
  styleUrls: ['./use-rate.component.scss'],
})
export class UseRateComponent implements OnInit, AfterViewInit {
  @ViewChild('chart_use_rate', { static: true }) chart: any;

  // Split-legend containers (same layout/placement as PR)
  @ViewChild('legendGen', { static: true })
  legendGen!: ElementRef<HTMLSpanElement>;
  @ViewChild('legendRate', { static: true })
  legendRate!: ElementRef<HTMLSpanElement>;

  // Cool tones for 발전량 (bars)
  colorArray: string[] = [
    'rgba(33, 150, 243, 0.85)',
    'rgba(0, 188, 212, 0.85)',
    'rgba(0, 150, 136, 0.85)',
    'rgba(76, 175, 80, 0.85)',
    'rgba(63, 81, 181, 0.85)',
    'rgba(3, 169, 244, 0.85)',
    'rgba(2, 136, 209, 0.85)',
    'rgba(0, 121, 107, 0.85)',
  ];

  // Warm / vivid tones for 이용률 (lines)
  colorArrayRev: string[] = [
    'rgba(255, 112, 67, 1.0)',
    'rgba(244, 81, 30, 1.0)',
    'rgba(255, 167, 38, 1.0)',
    'rgba(233, 30, 99, 1.0)',
    'rgba(194, 24, 91, 1.0)',
    'rgba(156, 39, 176, 1.0)',
    'rgba(255, 82, 82, 1.0)',
    'rgba(255, 202, 40, 1.0)',
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

  /** Helpers */
  isNonZero(v: any): boolean {
    const n = Number(v);
    return Number.isFinite(n) && n !== 0;
  }
  private toFixed6(n: any) {
    const num = Number(n);
    return Number.isFinite(num) ? Number(num.toFixed(6)) : 0;
  }
  private buildXAxis(labels: string[]) {
    const step = Math.max(1, Math.ceil(labels.length / 12));
    return {
      ticks: {
        autoSkip: false,
        maxRotation: 0,
        callback: (_: any, idx: number) =>
          idx % step === 0 ? labels[idx] : '',
      },
      grid: { drawTicks: true },
    };
  }
  private sizeCanvasToLabels(labels: string[]) {
    const perLabelPx = 70;
    const minWidthPx = 900;
    const canvasEl = document.getElementById(
      'chart_use_rate'
    ) as HTMLCanvasElement | null;
    if (!canvasEl) return;
    const targetWidth = Math.max(minWidthPx, labels.length * perLabelPx);
    canvasEl.style.width = `${targetWidth}px`;
  }
  private averageColumns(lists: number[]): number[];
  private averageColumns(lists: number[][]): number[];
  private averageColumns(lists: any): number[] {
    const arrs: number[][] = lists ?? [];
    const maxLength = arrs.length ? Math.max(...arrs.map((l) => l.length)) : 0;
    return Array.from({ length: maxLength }, (_, idx) => {
      let sum = 0,
        count = 0;
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
  /** Replace "인버터" with "-" and tidy up dashes/spaces */
  private cleanName(raw: string): string {
    return String(raw ?? '')
      .replace(/인버터/g, '-') // 201인버터1 -> 201-1
      .replace(/--+/g, '-') // collapse multiple dashes
      .replace(/^\-+|\-+$/g, '') // trim leading/trailing dashes
      .trim();
  }
  private withAlpha(rgba: string, alpha: number): string {
    const m = rgba.match(
      /rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i
    );
    if (!m) return rgba;
    return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
  }

  /** Custom split legend (bars solid tile; lines pill with hatch) */
  private splitLegendPlugin = {
    id: 'splitLegendUseRate',
    afterUpdate: (chart: Chart) => {
      const anyOpts: any = chart.options as any;
      const genEl = anyOpts.containers?.gen as HTMLElement;
      const rateEl = anyOpts.containers?.rate as HTMLElement;
      if (!genEl || !rateEl) return;

      [genEl, rateEl].forEach((el) => {
        el.innerHTML = '';
        el.style.display = 'flex';
        el.style.flexWrap = 'wrap';
        el.style.alignItems = 'center';
        el.style.gap = '8px 16px';
        el.style.marginBottom = '6px';
      });

      const items = (
        Chart.defaults.plugins.legend.labels as any
      ).generateLabels(chart);
      items.forEach((item: any) => {
        const ds: any = chart.data.datasets[item.datasetIndex];
        const isBar = ds.type === 'bar';
        const target = isBar ? genEl : rateEl;

        const wrap = document.createElement('span');
        wrap.style.display = 'inline-flex';
        wrap.style.alignItems = 'center';
        wrap.style.gap = '8px';
        wrap.style.cursor = 'pointer';
        wrap.style.margin = '4px 16px 4px 0';

        const sw = document.createElement('span');
        sw.style.display = 'inline-block';
        sw.style.width = '28px';
        sw.style.height = '12px';

        if (isBar) {
          const bg = (ds.backgroundColor as string) || item.fillStyle || '#999';
          sw.style.background = bg;
          sw.style.border = '2px solid transparent';
          sw.style.borderRadius = '2px';
        } else {
          const color =
            (ds.borderColor as string) || item.strokeStyle || '#666';
          sw.style.background = color; // solid fill
          sw.style.border = '2px solid transparent';
          sw.style.borderRadius = '2px'; // rectangular, not pill
        }

        const lbl = document.createElement('span');
        lbl.textContent = item.text;
        lbl.style.textDecoration = item.hidden ? 'line-through' : 'none';
        lbl.style.opacity = item.hidden ? '0.6' : '1';

        wrap.onclick = () => {
          const ci: any = chart;
          const meta = ci.getDatasetMeta(item.datasetIndex);
          meta.hidden =
            meta.hidden === null
              ? !ci.data.datasets[item.datasetIndex].hidden
              : null;
          lbl.style.textDecoration = meta.hidden ? 'line-through' : 'none';
          lbl.style.opacity = meta.hidden ? '0.6' : '1';
          ci.update();
        };

        wrap.appendChild(sw);
        wrap.appendChild(lbl);
        target.appendChild(wrap);
      });
    },
  };

  /** Base styling for ALL line datasets (dots visible) */
  private lineStyle(color: string, dashed = false) {
    return {
      type: 'line' as const,
      yAxisID: 'y2',
      order: 10, // draw above bars
      borderColor: color,
      backgroundColor: color,
      borderWidth: 3,
      pointRadius: 3, // <-- visible dots
      pointHoverRadius: 6,
      pointHitRadius: 10,
      pointStyle: 'circle' as const,
      pointBackgroundColor: color,
      pointBorderColor: '#ffffff',
      pointBorderWidth: 1.5,
      tension: 0.25,
      cubicInterpolationMode: 'monotone' as const,
      spanGaps: true,
      borderDash: dashed ? [6, 4] : undefined,
      // TS-safe "no clipping"
      clip: { left: 0, right: 0, top: 0, bottom: 0 } as any,
    };
  }

  // ---- CHART CREATION ----
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
            label: '발전량',
            data: [],
            borderColor: this.colorArray[0],
            backgroundColor: this.colorArray[0],
            yAxisID: 'y1',
            type: 'bar',
            order: 0,
          },
          {
            label: '이용률',
            data: [],
            ...this.lineStyle(this.colorArrayRev[0]),
          },
          {
            label: '전체(평균) 이용률',
            data: [],
            ...this.lineStyle(this.colorArrayRev[1], true),
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        aspectRatio: undefined as any,
        plugins: {
          legend: { display: false },
          tooltip: {
            mode: 'nearest',
            intersect: true,
            callbacks: {
              label: (ctx) => {
                let label = ctx.dataset.label ? `${ctx.dataset.label}: ` : '';
                const y = ctx.parsed.y;
                if (y == null) return label;
                return String(ctx.dataset.label).includes('이용률')
                  ? label + this.toFixed6(y) + ' %'
                  : label + y + ' kWh';
              },
            },
          },
        },
        datasets: {
          bar: { order: 0 },
          line: { order: 10 },
        },
        // @ts-ignore custom legend containers
        containers: {
          gen: this.legendGen?.nativeElement,
          rate: this.legendRate?.nativeElement,
        },
        interaction: { mode: 'nearest', intersect: true, axis: 'x' },
        elements: {
          line: { borderCapStyle: 'round', borderJoinStyle: 'round' },
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
            title: { display: true, text: '발전량 kWh', color: '#1f2937' },
            position: 'left',
          },
          y2: {
            type: 'linear',
            display: true,
            title: { display: true, text: '이용률 %', color: '#1f2937' },
            position: 'right',
            min: 0,
            max: 100,
          },
        },
      },
      plugins: [this.splitLegendPlugin],
    });
    this.sizeCanvasToLabels(this.chart.data.labels as string[]);
  }

  // ---- UI handlers (unchanged) ----
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

  // ---- DATA LOAD ----
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
              legend: { display: false },
              tooltip: {
                mode: 'nearest',
                intersect: true,
                callbacks: {
                  label: (ctx) => {
                    let label = ctx.dataset.label
                      ? `${ctx.dataset.label}: `
                      : '';
                    const y = ctx.parsed.y;
                    if (y == null) return label;
                    return String(ctx.dataset.label).includes('이용률')
                      ? label + this.toFixed6(y) + ' %'
                      : label + y + ' kWh';
                  },
                },
              },
            },
            datasets: { bar: { order: 0 }, line: { order: 10 } },
            // @ts-ignore custom legend containers
            containers: {
              gen: this.legendGen?.nativeElement,
              rate: this.legendRate?.nativeElement,
            },
            interaction: { mode: 'nearest', intersect: true, axis: 'x' },
            elements: {
              line: { borderCapStyle: 'round', borderJoinStyle: 'round' },
            },
            scales: {
              x: undefined,
              y1: {
                type: 'linear',
                display: true,
                title: { display: true, text: '발전량 kWh', color: '#1f2937' },
                position: 'left',
              },
              y2: {
                type: 'linear',
                display: true,
                title: { display: true, text: '이용률 %', color: '#1f2937' },
                position: 'right',
                min: 0,
                max: 100,
              },
            },
          },
          plugins: [this.splitLegendPlugin],
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
            useRateObject[title][hour] = this.toFixed6(r?.usageRate);
          }

          // Bars
          Object.keys(invObject).forEach((key, i) => {
            const clean = this.cleanName(key);
            this.tableHeadData.push(`${clean} 발전량`);
            this.tableData.push(invObject[key]);
            chartObject.data.datasets.push({
              label: `${clean} 발전량`,
              data: invObject[key],
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              yAxisID: 'y1',
              type: 'bar',
              order: 0,
            });
          });

          // Lines (+ total dashed)
          const avgList = this.averageColumns(Object.values(useRateObject));
          useRateObject['전체(평균)'] = avgList;

          Object.keys(useRateObject).forEach((key, i) => {
            const clean = key === '전체(평균)' ? key : this.cleanName(key);
            this.tableHeadData.push(`${clean} 이용률`);
            this.tableData.push(useRateObject[key]);
            chartObject.data.datasets.push({
              label: `${clean} 이용률`,
              data: useRateObject[key],
              ...this.lineStyle(
                this.colorArrayRev[i % this.colorArrayRev.length],
                clean === '전체(평균)'
              ),
            });
          });
        } else {
          // Day / Month
          if (gbn === 'day') {
            this.gbn = 'day';
            const s = moment(this.startDate).format('YYYY-MM-DD');
            const e = moment(this.endDate).format('YYYY-MM-DD');
            this.dateList = this.getDatesStartToLast(s, e);
          } else {
            this.gbn = 'month';
            const s = moment(this.startMonthDate).format('YYYY-MM');
            const e = moment(this.endMonthDate).format('YYYY-MM');
            this.dateList = this.getMonthDatesStartToLast(s, e);
          }
          chartObject.data.labels = this.dateList;
          chartObject.options.scales.x = this.buildXAxis(this.dateList);
          this.tableDayData = this.dateList;

          const idxByLabel = new Map<string, number>();
          if (gbn === 'day')
            this.dateList.forEach((lbl, i) =>
              idxByLabel.set(this.normDay(lbl), i)
            );
          else
            this.dateList.forEach((lbl, i) =>
              idxByLabel.set(this.normMonth(lbl), i)
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
            useRateObject[title][idx] = this.toFixed6(r?.usageRate);
          }

          // Bars
          Object.keys(invObject).forEach((key, i) => {
            const clean = this.cleanName(key);
            this.tableHeadData.push(`${clean} 발전량`);
            this.tableData.push(invObject[key]);
            chartObject.data.datasets.push({
              label: `${clean} 발전량`,
              data: invObject[key],
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              yAxisID: 'y1',
              type: 'bar',
              order: 0,
            });
          });

          // Lines (+ total dashed)
          const avgList = this.averageColumns(Object.values(useRateObject));
          useRateObject['전체(평균)'] = avgList;

          Object.keys(useRateObject).forEach((key, i) => {
            const clean = key === '전체(평균)' ? key : this.cleanName(key);
            this.tableHeadData.push(`${clean} 이용률`);
            this.tableData.push(useRateObject[key]);
            chartObject.data.datasets.push({
              label: `${clean} 이용률`,
              data: useRateObject[key],
              ...this.lineStyle(
                this.colorArrayRev[i % this.colorArrayRev.length],
                clean === '전체(평균)'
              ),
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

  // Daily list (YYYY.MM.DD)
  getDatesStartToLast(startDate: string, lastDate: string) {
    const regex = /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/;
    if (!(regex.test(startDate) && regex.test(lastDate))) return [];
    const result: string[] = [];
    let cur = moment(startDate, 'YYYY-MM-DD', true);
    const end = moment(lastDate, 'YYYY-MM-DD', true);
    if (!cur.isValid() || !end.isValid()) return [];
    while (cur.isSameOrBefore(end, 'day')) {
      result.push(cur.format('YYYY.MM.DD'));
      cur = cur.clone().add(1, 'day');
    }
    return result;
  }

  // Monthly list (YYYY.MM)
  getMonthDatesStartToLast(startDate: string, lastDate: string) {
    const regex = /^\d{4}-(0[1-9]|1[012])$/;
    if (!(regex.test(startDate) && regex.test(lastDate))) return [];
    const result: string[] = [];
    let cur = moment(startDate, 'YYYY-MM', true).startOf('month');
    const end = moment(lastDate, 'YYYY-MM', true).startOf('month');
    if (!cur.isValid() || !end.isValid()) return [];
    while (cur.isSameOrBefore(end, 'month')) {
      result.push(cur.format('YYYY.MM'));
      cur = cur.clone().add(1, 'month');
    }
    return result;
    ``;
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
