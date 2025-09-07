import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { SemsService } from '../../../services/sems-service';
import { Chart, registerables, Filler } from 'chart.js';
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

  // Legend containers (custom split legend)
  @ViewChild('legendGen', { static: true })
  legendGen!: ElementRef<HTMLSpanElement>;
  @ViewChild('legendPR', { static: true })
  legendPR!: ElementRef<HTMLSpanElement>;

  // Chart instance
  private chart?: Chart;

  // Bars palette (발전량)
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

  // PR palette (distinct from bars)
  prColors: string[] = [
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

  tableHeadData: any[] = [];
  tableDayData: any[] = [];
  tableData: any[] = [];
  gbn = '';
  dateList: string[] = [];

  constructor(private semsService: SemsService) {
    Chart.register(...registerables, Filler);
  }

  ngOnInit(): void {
    this.radio_input1_click();
    this.createChart();
  }

  ngAfterViewInit(): void {}

  /** Replace "인버터" with "-" and tidy up dashes/spaces */
  private cleanName(raw: string): string {
    return raw
      .replace(/인버터/g, '-') // 201인버터1 -> 201-1
      .replace(/--+/g, '-') // collapse multiple dashes
      .replace(/^\-+|\-+$/g, '') // trim leading/trailing dashes
      .trim();
  }

  /** helper to change alpha of rgba(...) */
  private withAlpha(rgba: string, alpha: number): string {
    const m = rgba.match(
      /rgba?\s*\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/i
    );
    if (!m) return rgba;
    const r = Number(m[1]),
      g = Number(m[2]),
      b = Number(m[3]);
    const a = isNaN(alpha) ? 0.35 : alpha;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  /** Custom plugin: render split legend (bars vs lines) with inline-colored swatches */
  private splitLegendPlugin = {
    id: 'splitLegend',
    afterUpdate: (chart: Chart) => {
      const anyOpts: any = chart.options as any;
      const genEl = anyOpts.containers?.gen as HTMLElement;
      const prEl = anyOpts.containers?.pr as HTMLElement;
      if (!genEl || !prEl) return;

      // Ensure container layout/gap
      [genEl, prEl].forEach((el) => {
        el.style.display = 'flex';
        el.style.flexWrap = 'wrap';
        el.style.alignItems = 'center';
        el.style.gap = '8px 16px';
        el.style.marginBottom = '6px';
      });

      genEl.innerHTML = '';
      prEl.innerHTML = '';

      const items = (
        Chart.defaults.plugins.legend.labels as any
      ).generateLabels(chart);

      items.forEach((item: any) => {
        const ds: any = chart.data.datasets[item.datasetIndex];
        const isBar = ds.type === 'bar';
        const target = isBar ? genEl : prEl;

        const wrapper = document.createElement('span');
        wrapper.style.display = 'inline-flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.gap = '8px';
        wrapper.style.cursor = 'pointer';
        wrapper.style.margin = '4px 16px 4px 0';

        const swatch = document.createElement('span');
        swatch.style.display = 'inline-block';
        swatch.style.width = '28px';
        swatch.style.height = '10px';
        swatch.style.borderRadius = '2px';
        swatch.style.verticalAlign = 'middle';

        if (isBar) {
          const bg = (ds.backgroundColor as string) || item.fillStyle || '#999';
          swatch.style.background = bg;
          swatch.style.border = '2px solid transparent';
        } else {
          const color =
            (ds.borderColor as string) || item.strokeStyle || '#666';
          swatch.style.background = this.withAlpha(color, 0.35); // show PR fill swatch
          swatch.style.border = `2px solid ${color}`;
        }

        const label = document.createElement('span');
        label.style.textDecoration = item.hidden ? 'line-through' : 'none';
        label.style.opacity = item.hidden ? '0.6' : '1';
        label.textContent = item.text;

        wrapper.onclick = () => {
          const ci: any = chart;
          const meta = ci.getDatasetMeta(item.datasetIndex);

          // Toggle dataset visibility
          meta.hidden =
            meta.hidden === null
              ? !ci.data.datasets[item.datasetIndex].hidden
              : null;

          // Strike-through when hidden
          if (meta.hidden) {
            label.style.textDecoration = 'line-through';
            label.style.opacity = '0.6';
          } else {
            label.style.textDecoration = 'none';
            label.style.opacity = '1';
          }

          ci.update();
        };

        wrapper.appendChild(swatch);
        wrapper.appendChild(label);
        target.appendChild(wrapper);
      });
    },
  };

  private sharedOptions() {
    return {
      aspectRatio: 2.5,
      responsive: true,
      plugins: {
        legend: { display: false },
        // IMPORTANT: show only hovered element (bar or line point)
        tooltip: {
          enabled: true,
          // In Chart.js v3+, the interaction mode is controlled by options.interaction,
          // but keeping this consistent doesn't hurt:
          mode: 'nearest' as const,
          intersect: true,
          callbacks: {
            label: (ctx: any) => {
              const dsLabel = ctx.dataset?.label ?? '';
              const val = ctx.parsed?.y ?? ctx.raw;
              if (ctx.dataset?.type === 'bar') {
                return `${dsLabel}: ${val} kWh`;
              }
              return `${dsLabel}: ${val} %`;
            },
          },
        },
      },
      // Make hover pick ONLY the closest element under the cursor
      interaction: {
        mode: 'nearest' as const,
        intersect: true,
        axis: 'x' as const,
      },
      // containers for custom legend
      // @ts-ignore
      containers: {
        gen: this.legendGen?.nativeElement,
        pr: this.legendPR?.nativeElement,
      },
      scales: {
        y1: {
          type: 'linear' as const,
          display: true,
          title: { display: true, text: '발전량 kWh', color: '#1f2937' },
          position: 'left' as const,
          grid: { drawOnChartArea: true },
        },
        y2: {
          type: 'linear' as const,
          display: true,
          title: { display: true, text: 'PR %', color: '#1f2937' },
          position: 'right' as const,
          grid: { drawOnChartArea: false },
          min: 0,
          max: 100,
        },
        x: { grid: { display: false } },
      },
    };
  }

  createChart() {
    const ctx = this.chartCanvas.nativeElement.getContext('2d')!;
    this.chart?.destroy();
    this.chart = new Chart(ctx, {
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
          // PR (lines with fill)
          {
            label: 'PR',
            data: [],
            type: 'line',
            yAxisID: 'y2',
            borderColor: this.prColors[0],
            backgroundColor: this.withAlpha(this.prColors[0], 0.35),
            fill: 'origin',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 6,
            order: 0,
          },
          {
            label: '전체 PR',
            data: [],
            type: 'line',
            yAxisID: 'y2',
            borderColor: this.prColors[1],
            backgroundColor: this.withAlpha(this.prColors[1], 0.35),
            fill: 'origin',
            tension: 0.3,
            borderWidth: 2,
            pointRadius: 0,
            pointHitRadius: 6,
            order: 0,
          },
          // 발전량 (bars)
          {
            label: '발전량',
            data: [],
            type: 'bar',
            yAxisID: 'y1',
            borderColor: this.colorArray[0],
            backgroundColor: this.colorArray[0],
            borderWidth: 0,
            order: 1,
          },
        ],
      },
      options: this.sharedOptions(),
      plugins: [this.splitLegendPlugin],
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
    document.getElementById('date_start')!.style.display = 'flex';
    document.getElementById('date_space')!.style.display = 'flex';
    document.getElementById('date_end')!.style.display = 'flex';
    document.getElementById('date_start_month')!.style.display = 'none';
    document.getElementById('date_end_month')!.style.display = 'none';
  }
  radio_input3_click() {
    (document.getElementById('radio_month') as HTMLInputElement).checked = true;
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
    let gbn: 'time' | 'day' | 'month' | undefined;
    let startDate: string | undefined;
    let endDate: string | undefined;

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
    } else if (
      (document.getElementById('radio_month') as HTMLInputElement).checked
    ) {
      gbn = 'month';
      startDate = moment(this.startMonthDate).format('YYYYMMDD');
      endDate = moment(this.endMonthDate).add(1, 'days').format('YYYYMMDD');
    }
    if (!gbn || !startDate || !endDate) return;

    this.semsService
      .getAnalyzePrInfo(gbn, startDate, endDate)
      .subscribe((res) => {
        this.tableHeadData = [];
        this.tableData = [];
        this.chart?.destroy();

        const chartObject: any = {
          type: 'line',
          data: { labels: [], datasets: [] },
          options: this.sharedOptions(),
          plugins: [this.splitLegendPlugin],
        };

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

          const titleList: string[] = [];
          for (const i of res[0])
            if (!titleList.includes(i[1])) titleList.push(i[1]);

          const invObject: Record<string, number[]> = {};
          const prObject: Record<string, number[]> = {};

          for (const title of titleList) {
            const tempList1 = new Array(24).fill(0);
            const tempList2 = new Array(24).fill(0);
            for (const i of res[0]) if (title === i[1]) tempList1[i[0]] = i[2];
            for (const i of res[1]) if (title === i[1]) tempList2[i[0]] = i[2];
            invObject[title] = tempList1;
            prObject[title] = tempList2;
          }

          // 발전량 (bars)
          Object.keys(invObject).forEach((key, i) => {
            const clean = this.cleanName(key);
            this.tableHeadData.push(`${clean} 발전량`);
            this.tableData.push(invObject[key]);
            chartObject.data.datasets.push({
              label: `${clean} 발전량`,
              data: invObject[key],
              type: 'bar',
              yAxisID: 'y1',
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              borderWidth: 0,
              order: 1,
            });
          });

          // 합계 PR
          const totalList = Object.values(prObject);
          const maxLength = Math.max(...totalList.map((l) => l.length));
          const sumList = Array.from({ length: maxLength }, (_, idx) =>
            totalList.reduce(
              (acc, list) => Math.round((acc + (list[idx] || 0)) * 1e6) / 1e6,
              0
            )
          );
          prObject['전체'] = sumList;

          // PR (lines with fill)
          let lineIdx = 0;
          for (const key of Object.keys(prObject)) {
            const clean = key === '전체' ? '전체' : this.cleanName(key);
            this.tableHeadData.push(`${clean} PR`);
            this.tableData.push(prObject[key]);
            const stroke = this.prColors[lineIdx % this.prColors.length];
            chartObject.data.datasets.push({
              label: `${clean} PR`,
              data: prObject[key],
              type: 'line',
              yAxisID: 'y2',
              borderColor: stroke,
              backgroundColor: this.withAlpha(stroke, 0.35),
              fill: 'origin',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0,
              pointHitRadius: 6,
              order: 0,
            });
            lineIdx++;
          }
        } else {
          // day / month
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

          const titleList: string[] = [];
          for (const i of res[0])
            if (!titleList.includes(i[1])) titleList.push(i[1]);

          const invObject: Record<string, number[]> = {};
          const prObject: Record<string, number[]> = {};
          for (const title of titleList) {
            const tempList1 = this.dateList.map(() => 0);
            const tempList2 = this.dateList.map(() => 0);
            for (const i of res[0])
              if (title === i[1]) tempList1[this.dateList.indexOf(i[0])] = i[2];
            for (const i of res[1])
              if (title === i[1]) tempList2[this.dateList.indexOf(i[0])] = i[2];
            invObject[title] = tempList1;
            prObject[title] = tempList2;
          }

          // 발전량 (bars)
          Object.keys(invObject).forEach((key, i) => {
            const clean = this.cleanName(key);
            this.tableHeadData.push(`${clean} 발전량`);
            this.tableData.push(invObject[key]);
            chartObject.data.datasets.push({
              label: `${clean} 발전량`,
              data: invObject[key],
              type: 'bar',
              yAxisID: 'y1',
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              borderWidth: 0,
              order: 1,
            });
          });

          // 합계 PR
          const totalList = Object.values(prObject);
          const maxLength = Math.max(...totalList.map((l) => l.length));
          const sumList = Array.from({ length: maxLength }, (_, idx) =>
            totalList.reduce(
              (acc, list) => Math.round((acc + (list[idx] || 0)) * 1e6) / 1e6,
              0
            )
          );
          prObject['전체'] = sumList;

          // PR (lines with fill)
          let lineIdx = 0;
          for (const key of Object.keys(prObject)) {
            const clean = key === '전체' ? '전체' : this.cleanName(key);
            this.tableHeadData.push(`${clean} PR`);
            this.tableData.push(prObject[key]);
            const stroke = this.prColors[lineIdx % this.prColors.length];
            chartObject.data.datasets.push({
              label: `${clean} PR`,
              data: prObject[key],
              type: 'line',
              yAxisID: 'y2',
              borderColor: stroke,
              backgroundColor: this.withAlpha(stroke, 0.35),
              fill: 'origin',
              tension: 0.3,
              borderWidth: 2,
              pointRadius: 0,
              pointHitRadius: 6,
              order: 0,
            });
            lineIdx++;
          }
        }

        const ctx = this.chartCanvas.nativeElement.getContext('2d')!;
        this.chart = new Chart(ctx, chartObject);
      });
  }

  getDatesStartToLast(startDate: string, lastDate: string): string[] {
    const regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
    if (!(regex.test(startDate) && regex.test(lastDate))) return [];
    const result: string[] = [];
    const curDate = new Date(startDate);
    while (curDate <= new Date(lastDate)) {
      result.push(curDate.toISOString().split('T')[0]);
      curDate.setDate(curDate.getDate() + 1);
    }
    return result;
  }

  getMonthDatesStartToLast(startDate: string, lastDate: string): string[] {
    const regex = RegExp(/^\d{4}-(0[1-9]|1[012])$/);
    if (!(regex.test(startDate) && regex.test(lastDate))) return [];
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
