import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef  } from '@angular/core';
import {SemsService} from "../../../services/sems-service";
import {ActivatedRoute} from "@angular/router";
import { Chart, registerables } from 'chart.js';
import moment from "moment";
import * as XLSX from "xlsx";

@Component({
  selector: 'app-temperature',
  templateUrl: './temperature.component.html',
  styleUrls: ['./temperature.component.scss']
})
export class TemperatureComponent implements OnInit, AfterViewInit {
  @ViewChild('chart_temperature', {static: true}) chart;

  invList = [];
  colorArray: any = ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(75,192,134,0.8)',
    'rgba(255, 159, 64, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 205, 86, 0.8)',
    'rgba(201, 203, 207, 0.8)', 'rgba(154,235,54,0.8)', 'rgba(236,111,227,0.8)'];
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

  constructor(private semsService: SemsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.getAnalyzeTemperatureInvList();
    this.radio_input1_click();
    this.createChart();
  }

  ngAfterViewInit(): void {
  }

  getAnalyzeTemperatureInvList() {
    this.semsService.getAnalyzeTemperatureInvList().subscribe(res => {
      console.log(res);
      for (let i of res) {
        this.invList.push({viewValue: i[0], value: i[1]})
      }
    });
  }

  createChart() {
    this.chart = new Chart('chart_temperature', {
      type: 'line',
      data: {
        labels: ['00시', '01시', '02시', '03시', '04시', '05시', '06시', '07시', '08시', '09시', '10시', '11시', '12시', '13시', '14시', '15시', '16시', '17시', '18시', '19시', '20시', '21시', '22시', '23시'],
        datasets: [
          { label: '인버터 발전량', data: [], borderColor: 'rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.8)', yAxisID: 'y1', type: 'bar' },
          { label: '모듈 후면', data: [], borderColor: 'rgba(153, 102, 255, 0.8)', backgroundColor: 'rgba(153, 102, 255, 0.8)', yAxisID: 'y2', type: 'line' },
          { label: '공기층', data: [], borderColor: 'rgba(75,192,134,0.8)', backgroundColor: 'rgba(75,192,134,0.8)', yAxisID: 'y3', type: 'line' },
          { label: '건물면', data: [], borderColor: 'rgba(54, 162, 235, 0.8)', backgroundColor: 'rgba(54, 162, 235, 0.8)', yAxisID: 'y4', type: 'line' },
        ]
      },
      options: {
        aspectRatio: 2.5,
        scales: {
          y1: { type: 'linear', display: true, title: {display: true, text: '인버터 발전량', color: 'rgba(0,0,0,0.8)'}, position: 'left' },
          y3: { type: 'linear', display: true, title: {display: true, text: '모듈 후면 °C', color: 'rgba(153, 102, 255, 0.8)'}, position: 'right' },
          y4: { type: 'linear', display: true, title: {display: true, text: '공기층 °C', color: 'rgba(75,192,134,0.8)'}, position: 'right' },
          y5: { type: 'linear', display: true, title: {display: true, text: '건물면 °C', color: 'rgba(54, 162, 235, 0.8)'}, position: 'right' },
        }
      },
    });
  }

  radio_input1_click() {
    // @ts-ignore
    document.getElementById('radio_time').checked = true;
    document.getElementById('date_start').style.display = 'flex';
    document.getElementById('date_space').style.display = 'none';
    document.getElementById('date_end').style.display = 'none';
    document.getElementById('date_start_month').style.display = 'none';
    document.getElementById('date_end_month').style.display = 'none';
  }

  radio_input2_click() {
    // @ts-ignore
    document.getElementById('radio_day').checked = true;
    document.getElementById('date_start').style.display = '';
    document.getElementById('date_space').style.display = 'flex';

    document.getElementById('date_start').style.display = 'flex';
    document.getElementById('date_end').style.display = 'flex';
    document.getElementById('date_start_month').style.display = 'none';
    document.getElementById('date_end_month').style.display = 'none';
  }

  radio_input3_click() {
    // @ts-ignore
    document.getElementById('radio_month').checked = true;
    document.getElementById('date_start').style.display = '';
    document.getElementById('date_space').style.display = 'flex';

    document.getElementById('date_start').style.display = 'none';
    document.getElementById('date_end').style.display = 'none';
    document.getElementById('date_start_month').style.display = 'flex';
    document.getElementById('date_end_month').style.display = 'flex';
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

    let tempDate = new Date(this.endMonthDate.getFullYear(), normalizedMonth.month() + 1, 0);
    this.endMonthDate = new Date(this.endMonthDate.getFullYear(), normalizedMonth.month(), tempDate.getDate());

    datepicker.close();
  }

  search_click() {
    let gbn;
    let startDate;
    let endDate;


    // @ts-ignore
    if(document.getElementById('radio_time').checked) {
      gbn = 'time';
      startDate =  moment(this.startDate).format('YYYYMMDD');
      endDate = moment(this.startDate).add(1, 'days').format('YYYYMMDD');
      // @ts-ignore
    } else if (document.getElementById('radio_day').checked) {
      gbn = 'day';
      startDate = moment(this.startDate).format('YYYYMMDD');
      endDate = moment(this.endDate).add(1, 'days').format('YYYYMMDD');
      // @ts-ignore
    } else if (document.getElementById('radio_month').checked) {
      gbn = 'month';
      startDate = moment(this.startMonthDate).format('YYYYMMDD');
      endDate = moment(this.endMonthDate).add(1, 'days').format('YYYYMMDD');
    }

    this.semsService.getAnalyzeTemperatureInfo(gbn, this.insNum.toString(), startDate, endDate).subscribe(res => {
      console.log(res);

      this.tableHeadData = [];
      this.tableData = [];
      this.chart.destroy();

      let chartObject: any = {
        type: 'line',
        data: {
          labels: [],
          datasets: [
            { label: '인버터 발전량', data: [], borderColor: 'rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.8)', yAxisID: 'y1', type: 'bar' },
            { label: '모듈 후면', data: [], borderColor: 'rgba(153, 102, 255, 0.8)', backgroundColor: 'rgba(153, 102, 255, 0.8)', yAxisID: 'y2', type: 'line' },
            { label: '공기층', data: [], borderColor: 'rgba(75,192,134,0.8)', backgroundColor: 'rgba(75,192,134,0.8)', yAxisID: 'y3', type: 'line' },
            { label: '건물면', data: [], borderColor: 'rgba(54, 162, 235, 0.8)', backgroundColor: 'rgba(54, 162, 235, 0.8)', yAxisID: 'y4', type: 'line' },
          ]
        },
        options: {
          aspectRatio: 2.5,
          scales: {
            y1: { type: 'linear', display: true, title: {display: true, text: '인버터 발전량 kWh', color: 'rgba(0,0,0,0.8)'}, position: 'left', min: 0 },
            y3: { type: 'linear', display: true, title: {display: true, text: '모듈 후면 °C', color: 'rgba(153, 102, 255, 0.8)'}, position: 'right', min: 0 },
            y4: { type: 'linear', display: true, title: {display: true, text: '공기층 °C', color: 'rgba(75,192,134,0.8)'}, position: 'right', min: 0 },
            y5: { type: 'linear', display: true, title: {display: true, text: '건물면 °C', color: 'rgba(54, 162, 235, 0.8)'}, position: 'right', min: 0 },
          }
        },
      }

      let invNameList = [];
      let temp1List = [];
      let temp2List = [];
      let temp3List = [];

      if (gbn === 'time') {
        this.gbn = 'time';
        chartObject.data.labels = ['00시', '01시', '02시', '03시', '04시', '05시', '06시', '07시', '08시', '09시', '10시', '11시', '12시', '13시', '14시', '15시', '16시', '17시', '18시', '19시', '20시', '21시', '22시', '23시'];

        let titleList = [];

        for (let i of res[0]) {
          if (!titleList.includes(i[1])) {
            titleList.push(i[1]);
          }
        }

        let invObject = {};
        for (let title of titleList) {
          let tempList1 = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

          for (let i of res[0]) {
            if (title === i[1]) {
              tempList1[i[0]] = i[2];
            }
          }

          invObject[title] = tempList1;
        }

        temp1List = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        temp2List = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        temp3List = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let i of res[1]) {
          temp1List[i[0]] = i[1];
          temp2List[i[0]] = i[2];
          temp3List[i[0]] = i[3];
        }

        for (let i=0; i<Object.keys(invObject).length; i++) {
          this.tableHeadData.push('인버터 발전량');
          this.tableData.push(invObject[Object.keys(invObject)[i]]);
          chartObject.data.datasets.push({ label: '인버터 발전량', data: invObject[Object.keys(invObject)[i]], borderColor: 'rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.8)', yAxisID: 'y1', type: 'bar' })
        }
      } else if (gbn === 'day' || gbn == 'month') {
        if (gbn === 'day') {
          this.gbn = 'day';
          startDate =  moment(this.startDate).format('YYYY-MM-DD');
          endDate = moment(this.endDate).format('YYYY-MM-DD');
          this.dateList = this.getDatesStartToLast(startDate, endDate);
          chartObject.data.labels = this.dateList;
          this.tableDayData = this.dateList;
        } else {
          this.gbn = 'month';
          startDate =  moment(this.startMonthDate).format('YYYY-MM');
          endDate = moment(this.endMonthDate).format('YYYY-MM');
          this.dateList = this.getMonthDatesStartToLast(startDate, endDate);
          chartObject.data.labels = this.dateList;
          this.tableDayData = this.dateList;
        }

        let titleList = [];

        for (let i of res[0]) {
          if (!titleList.includes(i[1])) {
            titleList.push(i[1]);
          }
        }

        let invObject = {};
        for (let title of titleList) {
          let tempList1 = [];

          for (let i of this.dateList) {
            tempList1.push(0);
          }

          for (let i of res[0]) {
            if (title === i[1]) {
              tempList1[this.dateList.indexOf(i[0])] = i[2];
            }
          }

          invObject[title] = tempList1;
        }

        for (let i of this.dateList) {
          temp1List.push(0);
          temp2List.push(0);
          temp3List.push(0);
        }

        for (let i of this.dateList) {
          for (let j of res[1]) {
            if (i === j[0]) {
              temp1List[this.dateList.indexOf(j[0])] = j[1];
              temp2List[this.dateList.indexOf(j[0])] = j[2];
              temp3List[this.dateList.indexOf(j[0])] = j[3];
            }
          }
        }

        for (let i=0; i<Object.keys(invObject).length; i++) {
          this.tableHeadData.push('인버터 발전량');
          this.tableData.push(invObject[Object.keys(invObject)[i]]);
          chartObject.data.datasets.push({ label: '인버터 발전량', data: invObject[Object.keys(invObject)[i]], borderColor: 'rgba(0,0,0,0.8)', backgroundColor: 'rgba(0,0,0,0.8)', yAxisID: 'y1', type: 'bar' })
        }
      }

      chartObject.data.datasets[1].data = temp1List;
      chartObject.data.datasets[2].data = temp2List;
      chartObject.data.datasets[3].data = temp3List;
      this.tableHeadData.push('모듈 후면');
      this.tableHeadData.push('공기층');
      this.tableHeadData.push('건물면');
      this.tableData.push(temp1List);
      this.tableData.push(temp2List);
      this.tableData.push(temp3List);

      console.log(chartObject);
      this.chart = new Chart('chart_temperature', chartObject);
    });
  }

  getDatesStartToLast(startDate, lastDate) {
    let regex = RegExp(/^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/);
    if(!(regex.test(startDate) && regex.test(lastDate))) return "Not Date Format";
    let result = [];
    let curDate = new Date(startDate);
    while(curDate <= new Date(lastDate)) {
      result.push(curDate.toISOString().split("T")[0]);
      curDate.setDate(curDate.getDate() + 1);
    }
    return result;
  }

  getMonthDatesStartToLast(startDate, lastDate) {
    let regex = RegExp(/^\d{4}-(0[1-9]|1[012])$/);
    if(!(regex.test(startDate) && regex.test(lastDate))) return "Not Date Format";
    let result = [];
    let curDate = new Date(startDate);
    while(curDate <= new Date(lastDate)) {
      result.push(moment(curDate).format('YYYY-MM'));
      curDate.setMonth(curDate.getMonth() + 1);
    }
    return result;
  }

  downloadToExcel(name: string) {
    let tableList = Array.prototype.map.call(document.querySelectorAll('#table tr'), function(tr){
      return Array.prototype.map.call(tr.querySelectorAll('td'), function(td){
        return td.innerHTML;
      });
    });

    let { sheetName, fileName } = this.getFileName(name);

    let wb = XLSX.utils.book_new();
    let ws = XLSX.utils.json_to_sheet(tableList);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${fileName}.xlsx`);
  }

  getFileName(name: string) {
    let timeSpan = new Date().toISOString();
    let sheetName = name || "ExportResult";
    let fileName = `${sheetName}-${timeSpan}`;
    return {
      sheetName,
      fileName
    };
  };

  changeValue(value) {
    this.insNum = value;
  }
}
