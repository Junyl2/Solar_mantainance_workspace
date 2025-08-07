import {Component, OnInit, Input} from '@angular/core';

// Service
import {ThemeService} from "../../../services/theme-service";


import {
  faChargingStation,
  faSmile,
  faMeh,
  faFrown,
} from '@fortawesome/free-solid-svg-icons';
import {SemsService} from 'src/app/services/sems-service';
import {Config} from "../home.component";
import { timer, Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-total-generation-board',
  templateUrl: './total-generation-board.component.html',
  styleUrls: ['./total-generation-board.component.scss']
})
export class TotalGenerationBoardComponent implements OnInit {

  @Input() theme: string = "light";
  private timer: Observable<number>;
  private subscription: Subscription;
  date: Date = new Date();
  data: any = {
    'DAILY': null,
    'WEEKLY': null,
    'MONTHLY': null,
    'DAILY_AVG': null,
    'WEEKLY_AVG': null,
    'MONTHLY_AVG': null,
  };
  dateFormat = {
    'DAILY': 'yyyy-MM-dd',
    'YEARLY': 'yyyy',
    'MONTHLY': 'yyyy-MM'
  }
  @Input() config: Config = {title: '', subTitle: '', api1: '', api2: '',colorIndex: 0, barChartFieldName: '', fieldName: '', unit: ''};

  constructor(public themeService: ThemeService,
              private semsService: SemsService
  ) {

  }

  ngOnInit(): void {
    // this.date = new Date('2022-08-01 15:00');
    this.timer = timer(0, 10000);
    this.subscription = this.timer.subscribe(n => {
      this.getTotalData();
    });

  }

  public getTotalData() {
    this.date = new Date();
    this.semsService.getInvertorStatGeneration(this.date, this.config.api2)
      .subscribe(res => {
        let fName: any = this.config.fieldName;
        for (let values of res) {
          if (['DAILY_AVG', 'WEEKLY_AVG', 'MONTHLY_AVG'].includes(values.name)) {
            if (values.summary.length > 0) {
              let v: any = {};
              let count = 0;
              let generationSum = 0;
              for (let obj of values.summary) {
                if (!obj || obj[fName] == null) {
                  continue;
                }
                count++;
                generationSum += Number(obj[fName]);
              }
              v[fName] = generationSum / count;
              values.summary = [v];
              console.log(values);
            }
          }

          this.data[values.name] = values;
        }

        this.data['DAILY'].compValue = this.getCompValue('DAILY', 'DAILY_LAST', fName);
        this.data['DAILY'].compValue2 = this.getCompValue('DAILY', 'DAILY_AVG', fName);
        this.data['WEEKLY'].compValue = this.getCompValue('WEEKLY', 'WEEKLY_LAST', fName);
        this.data['WEEKLY'].compValue2 = this.getCompValue('WEEKLY', 'WEEKLY_AVG', fName);
        this.data['MONTHLY'].compValue = this.getCompValue('MONTHLY', 'MONTHLY_LAST', fName);
        this.data['MONTHLY'].compValue2 = this.getCompValue('MONTHLY', 'MONTHLY_AVG', fName);
        console.log(this.data);
      })
  }

  private getCompValue(current: string, last: string, fName: any) {
    let currentValue = 0;
    for (let data of this.data[current].summary) {
      currentValue += Number(data[fName]);
    }
    let lastValue = 0;
    for (let data of this.data[last].summary) {
      lastValue += Number(data[fName]);
    }
    return (currentValue / lastValue) * 100;
  }
}
