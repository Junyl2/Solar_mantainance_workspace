import { Component, OnInit, AfterViewInit } from '@angular/core';
import { SemsService } from '../../../services/sems-service';
import { Chart, registerables } from 'chart.js';
import moment from 'moment';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-environment',
  templateUrl: './environment.component.html',
  styleUrls: ['./environment.component.scss'],
})
export class EnvironmentComponent implements OnInit, AfterViewInit {
  // If API already returns kWh, set to 'kWh'
  private readonly ENERGY_INCOMING_UNIT: 'Wh' | 'kWh' = 'Wh';
  private readonly ENERGY_TINY_EPS = 0.001; // kWh threshold for display
  private readonly ENV_DECIMALS = 2; // temp/%, m/s, Wh/㎡

  chart!: Chart;

  colorArray: string[] = [
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
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.radio_input1_click();
    this.createBaseChart();
  }

  ngAfterViewInit(): void {}

  // ---------- helpers ----------
  private toDisplayKwh(v: number | null | undefined): number {
    if (v == null || isNaN(+v)) return 0;
    return this.ENERGY_INCOMING_UNIT === 'Wh' ? +v / 1000 : +v;
  }
  private round(v: number, dp: number): number {
    if (v == null || isNaN(+v)) return 0;
    return +(+v).toFixed(dp);
  }

  // display helpers for template
  isNumber(v: any): boolean {
    return v !== null && v !== undefined && !isNaN(+v);
  }
  fmtEnergy(v: any): string {
    if (!this.isNumber(v)) return '-';
    const n = +v;
    if (n === 0) return '-';
    if (Math.abs(n) < this.ENERGY_TINY_EPS) return '<0.001 kWh';
    return `${n.toFixed(3)} kWh`;
  }

  private createBaseChart(): void {
    this.chart = new Chart('chart_environment', {
      type: 'line',
      data: {
        labels: Array.from(
          { length: 24 },
          (_, i) => `${i.toString().padStart(2, '0')}시`
        ),
        datasets: [
          {
            label: '온도',
            data: [],
            borderColor: 'rgba(255, 159, 64, 0.8)',
            backgroundColor: 'rgba(255, 159, 64, 0.8)',
            yAxisID: 'y2',
            type: 'line',
          },
          {
            label: '습도',
            data: [],
            borderColor: 'rgba(153, 102, 255, 0.8)',
            backgroundColor: 'rgba(153, 102, 255, 0.8)',
            yAxisID: 'y3',
            type: 'line',
          },
          {
            label: '풍속',
            data: [],
            borderColor: 'rgba(75,192,134,0.8)',
            backgroundColor: 'rgba(75,192,134,0.8)',
            yAxisID: 'y4',
            type: 'line',
          },
          {
            label: '일사량',
            data: [],
            borderColor: 'rgba(0,0,0,0.8)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            yAxisID: 'y5',
            type: 'line',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        responsive: true,
        interaction: {
          intersect: false,
          mode: 'index',
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
          },
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Time Period',
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
            },
          },
          y1: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: '발전량 kWh',
              color: 'rgba(54, 162, 235, 0.8)',
            },
            position: 'left',
            min: 0,
          },
          y2: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: '온도',
              color: 'rgba(255, 159, 64, 0.8)',
            },
            position: 'left',
            min: 0,
          },
          y3: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: '습도',
              color: 'rgba(153, 102, 255, 0.8)',
            },
            position: 'right',
            min: 0,
          },
          y4: {
            type: 'linear',
            display: true,
            title: {
              display: true,
              text: '풍속',
              color: 'rgba(75,192,134,0.8)',
            },
            position: 'right',
            min: 0,
          },
          y5: {
            type: 'linear',
            display: true,
            title: { display: true, text: '일사량', color: 'rgba(0,0,0,0.8)' },
            position: 'right',
            min: 0,
          },
        },
      },
    });
  }

  // ---------- radio + date UI ----------
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
    // Automatically update the chart when start date is changed
    this.search_click();
  }
  onEndDaySelected(normalizedDate: any) {
    this.endDate = normalizedDate.toDate();
    // Automatically update the chart when end date is changed
    this.search_click();
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
    // Automatically update the chart when start month is changed
    this.search_click();
  }
  onEndMonthSelected(normalizedYear: any) {
    this.endMonthDate.setFullYear(normalizedYear.year());
  }
  onEndMonthMonthSelected(normalizedMonth: any, datepicker: any) {
    this.endMonthDate.setFullYear(normalizedMonth.year());
    this.endMonthDate.setMonth(normalizedMonth.month());
    const last = new Date(
      this.endMonthDate.getFullYear(),
      normalizedMonth.month() + 1,
      0
    ).getDate();
    this.endMonthDate = new Date(
      this.endMonthDate.getFullYear(),
      normalizedMonth.month(),
      last
    );
    datepicker.close();
    // Automatically update the chart when end month is changed
    this.search_click();
  }

  // ---------- search ----------
  search_click() {
    let gbn: 'time' | 'day' | 'month' = 'time';
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
      .getAnalyzeEnvironmentInfo(gbn, startDate, endDate)
      .subscribe((res) => {
        // res[0] -> generation [timeOrDateIdxOrStr, inverterLabel, value]
        // res[1] -> env        [timeOrDateIdxOrStr, temp, hum, wind, irradiance]
        this.tableHeadData = [];
        this.tableData = [];
        if (this.chart) this.chart.destroy();

        const chartObject: any = {
          type: 'line',
          data: {
            labels: [],
            datasets: [
              {
                label: '온도',
                data: [],
                borderColor: 'rgba(255, 159, 64, 0.8)',
                backgroundColor: 'rgba(255, 159, 64, 0.8)',
                yAxisID: 'y2',
                type: 'line',
              },
              {
                label: '습도',
                data: [],
                borderColor: 'rgba(153, 102, 255, 0.8)',
                backgroundColor: 'rgba(153, 102, 255, 0.8)',
                yAxisID: 'y3',
                type: 'line',
              },
              {
                label: '풍속',
                data: [],
                borderColor: 'rgba(75,192,134, 0.8)',
                backgroundColor: 'rgba(75,192,134, 0.8)',
                yAxisID: 'y4',
                type: 'line',
              },
              {
                label: '일사량',
                data: [],
                borderColor: 'rgba(0,0,0,0.8)',
                backgroundColor: 'rgba(0,0,0,0.8)',
                yAxisID: 'y5',
                type: 'line',
              },
            ],
          },
          options: {
            maintainAspectRatio: false,
            responsive: true,
            interaction: {
              intersect: false,
              mode: 'index',
            },
            plugins: {
              legend: {
                display: true,
                position: 'top',
              },
            },
            scales: {
              x: {
                display: true,
                title: {
                  display: true,
                  text: 'Time Period',
                },
                ticks: {
                  maxRotation: 45,
                  minRotation: 0,
                },
              },
              y1: {
                type: 'linear',
                display: true,
                title: {
                  display: true,
                  text: '발전량 kWh',
                  color: 'rgba(54, 162, 235, 0.8)',
                },
                position: 'left',
                min: 0,
              },
              y2: {
                type: 'linear',
                display: true,
                title: {
                  display: true,
                  text: '온도',
                  color: 'rgba(255, 159, 64, 0.8)',
                },
                position: 'left',
                min: 0,
              },
              y3: {
                type: 'linear',
                display: true,
                title: {
                  display: true,
                  text: '습도',
                  color: 'rgba(153, 102, 255, 0.8)',
                },
                position: 'right',
                min: 0,
              },
              y4: {
                type: 'linear',
                display: true,
                title: {
                  display: true,
                  text: '풍속',
                  color: 'rgba(75,192,134,0.8)',
                },
                position: 'right',
                min: 0,
              },
              y5: {
                type: 'linear',
                display: true,
                title: {
                  display: true,
                  text: '일사량',
                  color: 'rgba(0,0,0,0.8)',
                },
                position: 'right',
                min: 0,
              },
            },
          },
        };

        let tempList: number[] = [];
        let humList: number[] = [];
        let windList: number[] = [];
        let irrList: number[] = [];

        // Chart environment data variables (for sampled data)
        let chartTempList: number[] = [];
        let chartHumList: number[] = [];
        let chartWindList: number[] = [];
        let chartIrrList: number[] = [];

        if (gbn === 'time') {
          this.gbn = 'time';
          chartObject.data.labels = Array.from(
            { length: 24 },
            (_, i) => `${i.toString().padStart(2, '0')}시`
          );

          // Build inverter datasets (per hour 0..23)
          const titleSet = new Set<string>();
          for (const row of res[0]) titleSet.add(row[1]);
          const invObject: Record<string, number[]> = {};
          for (const title of Array.from(titleSet))
            invObject[title] = new Array(24).fill(0);

          for (const row of res[0]) {
            const hr = +row[0]; // 0..23
            const title = row[1] as string;
            const raw = +row[2] || 0;
            invObject[title][hr] = this.toDisplayKwh(raw); // <-- keep unrounded kWh
          }

          tempList = new Array(24).fill(0);
          humList = new Array(24).fill(0);
          windList = new Array(24).fill(0);
          irrList = new Array(24).fill(0);

          // For time view, chart and table use the same data
          chartTempList = tempList;
          chartHumList = humList;
          chartWindList = windList;
          chartIrrList = irrList;

          for (const env of res[1]) {
            const hr = +env[0];
            tempList[hr] = this.round(+env[1] || 0, this.ENV_DECIMALS);
            humList[hr] = this.round(+env[2] || 0, this.ENV_DECIMALS);
            windList[hr] = this.round(+env[3] || 0, this.ENV_DECIMALS);
            irrList[hr] = this.round(+env[4] || 0, this.ENV_DECIMALS);
          }

          // add inverter datasets
          Object.keys(invObject).forEach((key, i) => {
            this.tableHeadData.push(key);
            this.tableData.push(invObject[key]);
            chartObject.data.datasets.push({
              label: key,
              data: invObject[key],
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              yAxisID: 'y1',
              type: 'bar',
            });
          });
        } else {
          // day or month
          if (gbn === 'day') {
            this.gbn = 'day';
            const s = moment(this.startDate).format('YYYY-MM-DD');
            const e = moment(this.endDate).format('YYYY-MM-DD');
            this.dateList = this.getDatesStartToLast(s, e);
            console.log('Daily date range:', {
              start: s,
              end: e,
              count: this.dateList.length,
            });
          } else {
            this.gbn = 'month';
            const s = moment(this.startMonthDate).format('YYYY-MM');
            const e = moment(this.endMonthDate).format('YYYY-MM');
            this.dateList = this.getMonthDatesStartToLast(s, e);
            console.log('Monthly date range:', {
              start: s,
              end: e,
              count: this.dateList.length,
            });
          }

          // Always use ALL data for chart - no sampling, just enable scrolling for long ranges
          chartObject.data.labels = this.dateList;
          this.tableDayData = this.dateList;

          console.log('Chart data setup:', {
            totalDates: this.dateList.length,
            firstDate: this.dateList[0],
            lastDate: this.dateList[this.dateList.length - 1],
            allLabels: this.dateList,
          });

          // Debug: Check if API data format matches our date format
          console.log('API data format check:', {
            sampleApiRow: res[0][0],
            sampleEnvRow: res[1][0],
            expectedDateFormat: gbn === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM',
            ourDateList: this.dateList.slice(0, 3),
          });

          const titleSet = new Set<string>();
          for (const row of res[0]) titleSet.add(row[1]);

          // Create separate data structures for chart and table
          const chartLabels = chartObject.data.labels as string[];
          const fullDateList = this.dateList; // Complete date list for table

          // Chart data (sampled or full depending on range length)
          const chartInvObject: Record<string, number[]> = {};
          for (const title of Array.from(titleSet))
            chartInvObject[title] = new Array(chartLabels.length).fill(0);

          for (const row of res[0]) {
            const dStr = row[0] as string; // 'YYYY-MM-DD' or 'YYYY-MM'
            const idx = chartLabels.indexOf(dStr);
            if (idx >= 0) {
              const raw = +row[2] || 0;
              chartInvObject[row[1]][idx] = this.toDisplayKwh(raw);
            }
          }

          console.log('Chart data mapping for all data:', {
            chartLabelsCount: chartLabels.length,
            fullDateListCount: fullDateList.length,
            totalDataPoints: this.dateList.length,
          });

          console.log('Chart data mapping debug:', {
            totalRows: res[0].length,
            chartLabels: chartLabels,
            sampleRow: res[0][0],
            mappedData: Object.keys(chartInvObject).map((key) => ({
              title: key,
              dataLength: chartInvObject[key].length,
              nonZeroCount: chartInvObject[key].filter((v) => v > 0).length,
              dataArray: chartInvObject[key],
            })),
          });

          // Table data (same as chart - all data)
          const tableInvObject: Record<string, number[]> = {};
          for (const title of Array.from(titleSet)) {
            tableInvObject[title] = [...chartInvObject[title]];
          }

          // Environment data for chart (sampled or full depending on range length)
          chartTempList = new Array(chartLabels.length).fill(0);
          chartHumList = new Array(chartLabels.length).fill(0);
          chartWindList = new Array(chartLabels.length).fill(0);
          chartIrrList = new Array(chartLabels.length).fill(0);

          for (const env of res[1]) {
            const dStr = env[0] as string;
            const idx = chartLabels.indexOf(dStr);
            if (idx >= 0) {
              chartTempList[idx] = this.round(+env[1] || 0, this.ENV_DECIMALS);
              chartHumList[idx] = this.round(+env[2] || 0, this.ENV_DECIMALS);
              chartWindList[idx] = this.round(+env[3] || 0, this.ENV_DECIMALS);
              chartIrrList[idx] = this.round(+env[4] || 0, this.ENV_DECIMALS);
            }
          }

          console.log('Environment data mapping for all data:', {
            envDataPoints: res[1].length,
            chartEnvDataLength: chartTempList.length,
            nonZeroTemp: chartTempList.filter((v) => v > 0).length,
            nonZeroHum: chartHumList.filter((v) => v > 0).length,
          });

          console.log('Chart environment data debug:', {
            envRows: res[1].length,
            chartEnvDataLength: chartTempList.length,
            nonZeroTemp: chartTempList.filter((v) => v > 0).length,
            nonZeroHum: chartHumList.filter((v) => v > 0).length,
            sampleEnvRow: res[1][0],
            tempDataArray: chartTempList,
            humDataArray: chartHumList,
            windDataArray: chartWindList,
            irrDataArray: chartIrrList,
          });

          // Environment data for table (same as chart - all data)
          tempList = [...chartTempList];
          humList = [...chartHumList];
          windList = [...chartWindList];
          irrList = [...chartIrrList];

          // Add chart datasets (sampled data)
          Object.keys(chartInvObject).forEach((key, i) => {
            chartObject.data.datasets.push({
              label: key,
              data: chartInvObject[key],
              borderColor: this.colorArray[i % this.colorArray.length],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              yAxisID: 'y1',
              type: 'bar',
            });
          });

          // Add table data (complete data)
          Object.keys(tableInvObject).forEach((key, i) => {
            this.tableHeadData.push(key);
            this.tableData.push(tableInvObject[key]);
          });

          console.log('Chart vs Table data comparison:', {
            chartLabels: chartLabels.length,
            tableLabels: fullDateList.length,
            chartDataPoints:
              chartInvObject[Object.keys(chartInvObject)[0]]?.length || 0,
            tableDataPoints:
              tableInvObject[Object.keys(tableInvObject)[0]]?.length || 0,
          });
        }

        // env lines & env rows (use chart data for chart, table data for table)
        chartObject.data.datasets[0].data = chartTempList;
        chartObject.data.datasets[1].data = chartHumList;
        chartObject.data.datasets[2].data = chartWindList;
        chartObject.data.datasets[3].data = chartIrrList;

        // Ensure line charts are properly configured
        chartObject.data.datasets[0].tension = 0.1; // Smooth lines
        chartObject.data.datasets[1].tension = 0.1;
        chartObject.data.datasets[2].tension = 0.1;
        chartObject.data.datasets[3].tension = 0.1;

        chartObject.data.datasets[0].pointRadius = 3; // Visible points
        chartObject.data.datasets[1].pointRadius = 3;
        chartObject.data.datasets[2].pointRadius = 3;
        chartObject.data.datasets[3].pointRadius = 3;

        console.log('Final chart configuration:', {
          totalDatasets: chartObject.data.datasets.length,
          labels: chartObject.data.labels,
          firstDatasetData: chartObject.data.datasets[0]?.data?.length || 0,
          envDatasetData: chartObject.data.datasets[4]?.data?.length || 0,
          tempDatasetData: chartObject.data.datasets[0]?.data,
          humDatasetData: chartObject.data.datasets[1]?.data,
          windDatasetData: chartObject.data.datasets[2]?.data,
          irrDatasetData: chartObject.data.datasets[3]?.data,
        });

        // Inform user about data range scenarios
        if (chartObject.data.labels.length === 1) {
          console.log(
            '📊 Single data point detected - showing individual values for',
            chartObject.data.labels[0]
          );
          console.log(
            '💡 Tip: Select a longer date range to see line graphs with multiple data points'
          );
        } else if (this.dateList.length > 5) {
          console.log(
            '📊 Long range detected - showing all',
            this.dateList.length,
            'data points'
          );
          console.log('💡 All data is displayed accurately in chart and table');
        }

        this.tableHeadData.push('온도', '습도', '풍속', '일사량');
        this.tableData.push(tempList, humList, windList, irrList);

        this.chart = new Chart('chart_environment', chartObject);
      });
  }

  // Local-safe continuous date lists
  getDatesStartToLast(startDate: string, lastDate: string): string[] {
    const rx = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
    if (!rx.test(startDate) || !rx.test(lastDate)) return [];
    const res: string[] = [];
    let cur = moment(startDate, 'YYYY-MM-DD');
    const end = moment(lastDate, 'YYYY-MM-DD');
    while (cur.isSameOrBefore(end, 'day')) {
      res.push(cur.format('YYYY-MM-DD'));
      cur = cur.add(1, 'day');
    }
    return res;
  }

  getMonthDatesStartToLast(startDate: string, lastDate: string): string[] {
    const rx = /^\d{4}-(0[1-9]|1[0-2])$/;
    if (!rx.test(startDate) || !rx.test(lastDate)) return [];
    const res: string[] = [];
    let cur = moment(startDate, 'YYYY-MM');
    const end = moment(lastDate, 'YYYY-MM');
    while (cur.isSameOrBefore(end, 'month')) {
      res.push(cur.format('YYYY-MM'));
      cur = cur.add(1, 'month');
    }
    return res;
  }

  downloadToExcel(name: string) {
    const table = document.querySelector('#table') as HTMLTableElement;
    if (!table) return;

    const rows = Array.from(table.querySelectorAll('tr'));
    const data = rows.map((tr) =>
      Array.from(tr.children).map((td) => (td as HTMLElement).innerText.trim())
    );

    const { sheetName, fileName } = this.getFileName(name);
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
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
