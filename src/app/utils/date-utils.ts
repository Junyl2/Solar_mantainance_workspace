import moment from 'moment';
import { format } from 'date-fns';

export class DateUtils {
  constructor() {
  }
  static getSpanYearMonthStringArray(endDate: Date, startDate: Date) {
    var endYear = endDate.getFullYear();
    var startYear = startDate.getFullYear();
    let yearMonthStringArray: string[] = [];
    if (endDate.getFullYear() > startDate.getFullYear()) {
      while (endDate > startDate) {
        yearMonthStringArray.push(startDate.getFullYear() + '-' + (startDate.getMonth() + 1));
        startDate = moment(startDate).add(1, 'M').toDate();
      }

    } else if (endDate.getFullYear() == startDate.getFullYear()){
      for (let m = startDate.getMonth(); m <= endDate.getMonth(); m++) {
        yearMonthStringArray.push(endDate.getFullYear() + '-' + (m + 1));
      }
    }
    return yearMonthStringArray;
  }

  static getSpanYYMMStringArray(endDate: Date, startDate: Date) {
    let yearMonthStringArray: string[] = [];
    if (endDate > startDate) {
      while (endDate > startDate) {
        yearMonthStringArray.push(format(startDate, 'yy-MM'));
        startDate = moment(startDate).add(1, 'M').toDate();
      }

    } else if (endDate.getFullYear() == startDate.getFullYear()){
      for (let m = startDate.getMonth(); m <= endDate.getMonth(); m++) {
        yearMonthStringArray.push(endDate.getFullYear() + '-' + (m + 1));
      }
    }
    return yearMonthStringArray;
  }

  static getSpanMonthCount (endDate: Date, startDate: Date) : number {
    var count = 0;
    if (endDate.getFullYear() > startDate.getFullYear()) {
      while (endDate > startDate) {
        count++;
        startDate = moment(startDate).add(1, 'M').toDate();
      }

    } else if (endDate.getFullYear() == startDate.getFullYear()){
      for (let m = startDate.getMonth(); m <= endDate.getMonth(); m++) {
        count++;
      }
    }
    return count;
  }


  static getSpanMonthDayStringArray(startDate: Date, endDate: Date) : string[] {
    let monthDayStringArray: string[] = [];

    while (endDate >= startDate) {
      monthDayStringArray.push(format(startDate, 'MM-dd'));
      startDate = moment(startDate).add(1, 'd').toDate();
    }

    return monthDayStringArray;
  }

  static getSpanDayCount(endDate: Date, startDate: Date) : number {
    let count : number = 0;
    while (endDate > startDate) {
      count++;
      startDate = moment(startDate).add(1, 'd').toDate();
    }
    return count;
  }


  static getSpanTimeStringArray(): string[] {
    let timeStringArray: string[] = [];
    for (let i = 0; i < 24; i++) {
      timeStringArray.push(i.toString().padStart(2, '0'));
    }
    return timeStringArray;
  }

  /* 태양광 발전 최근 1주일치 날자 라벨 생성 */
  static getBarChartLabel(now: Date): string[] {
    let timeStringArray: string[] = [];
    now.setDate(now.getDate() - 7);
    for (let i = 0; i < 7; i++) {
      let date = new Date(now.setDate(now.getDate() + 1));
      let a = moment(date).format('yyyy-MM-DD');
      timeStringArray.push(a);
    }
    return timeStringArray;
  }
}
