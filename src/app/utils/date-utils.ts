import moment from 'moment';
import { format } from 'date-fns';

export class DateUtils {
  constructor() {}
  static getSpanYearMonthStringArray(endDate: Date, startDate: Date) {
    var endYear = endDate.getFullYear();
    var startYear = startDate.getFullYear();
    let yearMonthStringArray: string[] = [];
    if (endDate.getFullYear() > startDate.getFullYear()) {
      while (endDate > startDate) {
        yearMonthStringArray.push(
          startDate.getFullYear() + '-' + (startDate.getMonth() + 1)
        );
        startDate = moment(startDate).add(1, 'M').toDate();
      }
    } else if (endDate.getFullYear() == startDate.getFullYear()) {
      for (let m = startDate.getMonth(); m <= endDate.getMonth(); m++) {
        yearMonthStringArray.push(endDate.getFullYear() + '-' + (m + 1));
      }
    }
    return yearMonthStringArray;
  }

  static getSpanYYMMStringArray(endDate: Date, startDate: Date) {
    let yearMonthStringArray: string[] = [];
    let currentDate = new Date(startDate);

    console.log('getSpanYYMMStringArray called with:', {
      startDate: startDate,
      endDate: endDate,
    });

    // Normalize dates to first day of month for proper comparison
    currentDate.setDate(1);
    const normalizedEndDate = new Date(endDate);
    normalizedEndDate.setDate(1);

    while (currentDate <= normalizedEndDate) {
      yearMonthStringArray.push(format(currentDate, 'yy-MM'));
      currentDate = moment(currentDate).add(1, 'M').toDate();
    }

    console.log('Generated monthly labels:', yearMonthStringArray);
    return yearMonthStringArray;
  }

  static getSpanMonthCount(endDate: Date, startDate: Date): number {
    var count = 0;
    if (endDate.getFullYear() > startDate.getFullYear()) {
      while (endDate > startDate) {
        count++;
        startDate = moment(startDate).add(1, 'M').toDate();
      }
    } else if (endDate.getFullYear() == startDate.getFullYear()) {
      for (let m = startDate.getMonth(); m <= endDate.getMonth(); m++) {
        count++;
      }
    }
    return count;
  }

  static getSpanMonthDayStringArray(startDate: Date, endDate: Date): string[] {
    let monthDayStringArray: string[] = [];
    let currentDate = new Date(startDate);

    console.log('getSpanMonthDayStringArray called with:', {
      startDate: startDate,
      endDate: endDate,
    });

    while (currentDate <= endDate) {
      monthDayStringArray.push(format(currentDate, 'MM-dd'));
      currentDate = moment(currentDate).add(1, 'd').toDate();
    }

    console.log('Generated date labels:', monthDayStringArray);
    return monthDayStringArray;
  }

  static getSpanDayCount(endDate: Date, startDate: Date): number {
    let count: number = 0;
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
