import { Component, OnInit, SimpleChanges } from '@angular/core';



// Angular Material Datepicker
import { MatDatepicker, MatDatepickerInput, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { Moment } from 'moment';

import moment from 'moment';

// Services
import { SemsService } from '../../services/sems-service';
import { DateAdapter } from '@angular/material/core';

// Utils
import { DateUtils } from '../../utils/date-utils';


@Component({
  selector: 'app-weather-into',
  templateUrl: './weather-info.component.html',
  styleUrls: ['./weather-info.component.css'],
  providers: [
  ],
})
export class WeatherInfoComponent implements OnInit {

  MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];

  pickerStartDate = new Date(2022, 0, 1);

  startYMat!: Date;
  endYMat!: Date;

  // Monthly ----------------------
  startMonthlyDate: Date = new Date();
  startMinMonthlyDate!: Date;
  startMaxMonthlyDate!: Date;
  endMonthlyDate: Date = new Date();
  endMinMonthlyDate!: Date;
  endMaxMonthlyDate!: Date;
  monthlyLabels!: string[];

  // Daily -------------------------
  startDailyDate: Date = new Date();
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endDailyDate: Date = new Date();
  endMinDailyDate!: Date;
  endMaxDailyDate!: Date;
  dailyLabels!: string[];

  // Time --------------------------
  timeDate: Date = new Date();
  minTimeDate!: Date;
  maxTimeDate!: Date;
  timeLabels!: string[];

  constructor(private semsService: SemsService,
    private dateAdapter: DateAdapter<any>) {

    // Monthly ----------------------
    this.startMinMonthlyDate = this.semsService.getInstalledDate();
    this.startMaxMonthlyDate = moment().toDate();
    this.endMinMonthlyDate = this.startMinMonthlyDate;
    this.endMaxMonthlyDate = this.startMaxMonthlyDate;
    this.startMonthlyDate = this.startMinMonthlyDate;
    this.endMonthlyDate = moment().toDate();
    this.monthlyLabels = DateUtils.getSpanYearMonthStringArray(this.endMonthlyDate, this.startMonthlyDate);

    // Daily -------------------------
    this.startMinDailyDate = this.semsService.getInstalledDate();
    this.startMaxDailyDate = moment().toDate();
    this.endMinDailyDate = this.startMinDailyDate;
    this.endMaxDailyDate = this.startMaxDailyDate;
    this.startDailyDate = this.startMinDailyDate;
    this.endDailyDate = moment().toDate();
    this.dailyLabels = DateUtils.getSpanMonthDayStringArray(this.endDailyDate, this.startDailyDate);

    // Time ---------------------------
    this.timeDate = this.maxTimeDate = moment().toDate();
    this.minTimeDate = this.semsService.getInstalledDate();
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges) {
  }

  // Monthly ------------------------------------------------------
  onStartMonthlyYearSelected(normalizedYear: Moment) {
    this.startMonthlyDate.setFullYear(normalizedYear.year());
  }
  onStartMonthlyMonthSelected(normalizedMonth: Moment, datepicker: MatDatepicker<Date>) {
    this.startMonthlyDate.setMonth(normalizedMonth.month());
    this.startMonthlyDate = new Date(this.startMonthlyDate);

    this.endMinMonthlyDate = this.startMonthlyDate;
    datepicker.close();

    this.monthlyLabels = DateUtils.getSpanYearMonthStringArray(this.endMonthlyDate, this.startMonthlyDate);
  }

  onEndMonthlyYearSelected(normalizedYear: Moment) {
    this.endMonthlyDate.setFullYear(normalizedYear.year());
  }
  onEndMonthlyMonthSelected(normalizedMonth: Moment, datepicker: MatDatepicker<Date>) {
    this.endMonthlyDate.setMonth(normalizedMonth.month());
    this.endMonthlyDate = new Date(this.endMonthlyDate);
    datepicker.close();

    this.monthlyLabels = DateUtils.getSpanYearMonthStringArray(this.endMonthlyDate, this.startMonthlyDate);
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    this.startDailyDate = normalizedDate.toDate();
    this.dailyLabels = DateUtils.getSpanMonthDayStringArray(this.endDailyDate, this.startDailyDate);
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.toDate();
    this.dailyLabels = DateUtils.getSpanMonthDayStringArray(this.endDailyDate, this.startDailyDate);
  }

  // Time ------------------------------------------------------------

  onTimeDateSelected(normalizedDate: Moment) {
    this.timeDate = normalizedDate.toDate();
    this.timeLabels = DateUtils.getSpanTimeStringArray();
  }

}
