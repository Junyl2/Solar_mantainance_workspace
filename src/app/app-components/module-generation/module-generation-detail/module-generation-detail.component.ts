import { Component, OnInit, AfterViewInit, ViewChild, ChangeDetectorRef  } from '@angular/core';
import {SemsService} from "../../../services/sems-service";
import {ActivatedRoute} from "@angular/router";
import { Chart, registerables} from 'chart.js';
import moment from "moment";

@Component({
  selector: 'app-module-generation-detail',
  templateUrl: './module-generation-detail.component.html',
  styleUrls: ['./module-generation-detail.component.scss']
})
export class ModuleGenerationDetailComponent implements OnInit, AfterViewInit {
  @ViewChild('chart_module', {static: true}) chart;

  colorArray: any = ['rgba(54, 162, 235, 0.8)', 'rgba(255, 99, 132, 0.8)', 'rgba(75,192,134,0.8)', 'rgba(255, 159, 64, 0.8)', 'rgba(153, 102, 255, 0.8)', 'rgba(255, 205, 86, 0.8)', 'rgba(201, 203, 207, 0.8)', 'rgba(154,235,54,0.8)', 'rgba(236,111,227,0.8)'];
  startDate: Date = new Date();
  endDate: Date = new Date();
  startMonthDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  tempMonthDate: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  endMonthDate: Date = new Date(new Date().getFullYear(), new Date().getMonth(), this.tempMonthDate.getDate());
  tableHeadData: any = [];
  tableDayData: any = [];
  tableData: any = [];
  gbn = '';

  constructor(private semsService: SemsService) {
    Chart.register(...registerables);
  }

  ngOnInit(): void {
    this.radio_input1_click();
    this.chart_btn_click();

    this.createChart();
  }

  ngAfterViewInit(): void {
  }

  createChart() {
    this.chart = new Chart('chart_module', {
      type: 'line',
      data: {
        labels: ['00시', '01시', '02시', '03시', '04시', '05시', '06시', '07시', '08시', '09시', '10시', '11시', '12시',
          '13시', '14시', '15시', '16시', '17시', '18시', '19시', '20시', '21시', '22시', '23시'],
        datasets: [
          {
            label: "옵티마이저",
            data: [],
            backgroundColor: 'rgba(54, 162, 235, 0.8)'
          }
        ]
      },
      options: {
        aspectRatio:2.5
      }
    });
  }

  table_btn_click() {
    document.getElementById('table_btn').style.backgroundColor = '#f93939';
    document.getElementById('chart_btn').style.backgroundColor = '#4e4e4e';
    document.getElementById('box2_table_box').style.display = 'flex';
    document.getElementById('box2_chart_box').style.display = 'none';
  }

  chart_btn_click() {
    document.getElementById('table_btn').style.backgroundColor = '#4e4e4e';
    document.getElementById('chart_btn').style.backgroundColor = '#f93939';
    document.getElementById('box2_table_box').style.display = 'none';
    document.getElementById('box2_chart_box').style.display = 'flex';
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
    document.getElementById('date_space').style.display = '';

    document.getElementById('date_start').style.display = 'flex';
    document.getElementById('date_end').style.display = 'flex';
    document.getElementById('date_start_month').style.display = 'none';
    document.getElementById('date_end_month').style.display = 'none';
  }

  radio_input3_click() {
    // @ts-ignore
    document.getElementById('radio_month').checked = true;
    document.getElementById('date_start').style.display = '';
    document.getElementById('date_space').style.display = '';

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
    let insNum = Number(document.location.href.toString().split('/')[document.location.href.toString().split('/').length - 1]);

    let chartObject: any = {
      type: 'bar',
      data: {
        labels: [],
        datasets: []
      },
      options: { aspectRatio: 2.5 }
    }

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

    this.semsService.getModuleGenerationDetailInfo(gbn, insNum, startDate, endDate).subscribe(res => {
      console.log(res);
      this.tableHeadData = [];
      this.tableData = [];

      if (res.length !== 0) {
        this.chart.destroy();
        let optObject = {};

        if (gbn === 'time') {
          this.gbn = 'time';

          chartObject = {
            type: 'bar',
            data: {
              labels: ['00시', '01시', '02시', '03시', '04시', '05시', '06시', '07시', '08시', '09시', '10시', '11시', '12시',
                '13시', '14시', '15시', '16시', '17시', '18시', '19시', '20시', '21시', '22시', '23시'],
              datasets: []
            },
            options: { aspectRatio: 2.5 }
          }

          for (let i of res) {
            if (optObject[i[0]] === undefined) {
              optObject[i[0]] = [];
            }
          }

          console.log(optObject);

          for (let i=0; i<24; i++) {
            for (let j of Object.keys(optObject)) {
              optObject[j].push(0);
            }
          }

          for (let i of res) {
            optObject[i[0]][i[2]] = i[1];
          }

          for (let i=0; i<Object.keys(optObject).length; i++) {
            chartObject.data.datasets.push({
              label: Object.keys(optObject)[i],
              data: optObject[Object.keys(optObject)[i]],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              borderColor: this.colorArray[i % this.colorArray.length]
            })
          }

          this.chart = new Chart('chart_module', chartObject);

          // Table Head Data Setting
          for (let i of Object.keys(optObject)) {
            this.tableHeadData.push(i);
          }


          // Table Body Data Setting
          for (let i=0; i<24; i++) {
            this.tableData.push([]);
            for (let j=0; j<Object.keys(optObject).length; j++) {
              this.tableData[i].push(0);
            }
          }

          for (let i of res) {
            let keyIndex = Object.keys(optObject).indexOf(i[0].toString());
            this.tableData[i[2]][keyIndex] = i[1];
          }
        } else if (gbn === 'day') {
          this.gbn = 'day';
          let startDate =  moment(this.startDate).format('YYYY-MM-DD');
          let endDate = moment(this.endDate).format('YYYY-MM-DD');
          let dateList = this.getDatesStartToLast(startDate, endDate);
          chartObject.data.labels = dateList;
          this.tableDayData = dateList;

          for (let i of res) {
            if (optObject[i[0]] === undefined) {
              optObject[i[0]] = [];
            }
          }

          console.log(optObject);

          for (let i=0; i<dateList.length; i++) {
            for (let j of Object.keys(optObject)) {
              optObject[j].push(0);
            }
          }

          for (let i of res) {
            optObject[i[0]][dateList.indexOf(i[2])] = i[1];
          }

          for (let i=0; i<Object.keys(optObject).length; i++) {
            chartObject.data.datasets.push({
              label: Object.keys(optObject)[i],
              data: optObject[Object.keys(optObject)[i]],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              borderColor: this.colorArray[i % this.colorArray.length]
            })
          }

          this.chart = new Chart('chart_module', chartObject);

          // Table Head Data Setting
          for (let i of Object.keys(optObject)) {
            this.tableHeadData.push(i);
          }


          // Table Body Data Setting
          for (let i=0; i<dateList.length; i++) {
            this.tableData.push([]);
            for (let j=0; j<Object.keys(optObject).length; j++) {
              this.tableData[i].push(0);
            }
          }

          for (let i of res) {
            let keyIndex = Object.keys(optObject).indexOf(i[0].toString());
            this.tableData[dateList.indexOf(i[2])][keyIndex] = i[1];
          }
        } else if (gbn === 'month') {
          this.gbn = 'month';
          let startDate =  moment(this.startMonthDate).format('YYYY-MM');
          let endDate = moment(this.endMonthDate).format('YYYY-MM');
          let dateList = this.getMonthDatesStartToLast(startDate, endDate);
          chartObject.data.labels = dateList;
          this.tableDayData = dateList;

          for (let i of res) {
            if (optObject[i[0]] === undefined) {
              optObject[i[0]] = [];
            }
          }

          console.log(optObject);

          for (let i=0; i<dateList.length; i++) {
            for (let j of Object.keys(optObject)) {
              optObject[j].push(0);
            }
          }

          for (let i of res) {
            optObject[i[0]][dateList.indexOf(i[2])] = i[1];
          }

          for (let i=0; i<Object.keys(optObject).length; i++) {
            chartObject.data.datasets.push({
              label: Object.keys(optObject)[i],
              data: optObject[Object.keys(optObject)[i]],
              backgroundColor: this.colorArray[i % this.colorArray.length],
              borderColor: this.colorArray[i % this.colorArray.length]
            })
          }

          this.chart = new Chart('chart_module', chartObject);

          // Table Head Data Setting
          for (let i of Object.keys(optObject)) {
            this.tableHeadData.push(i);
          }


          // Table Body Data Setting
          for (let i=0; i<dateList.length; i++) {
            this.tableData.push([]);
            for (let j=0; j<Object.keys(optObject).length; j++) {
              this.tableData[i].push(0);
            }
          }

          for (let i of res) {
            let keyIndex = Object.keys(optObject).indexOf(i[0].toString());
            this.tableData[dateList.indexOf(i[2])][keyIndex] = i[1];
          }
        }
      } else {
        this.tableHeadData = [];
        this.tableData = [];
        this.chart.destroy();
        this.createChart();
      }
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
}
