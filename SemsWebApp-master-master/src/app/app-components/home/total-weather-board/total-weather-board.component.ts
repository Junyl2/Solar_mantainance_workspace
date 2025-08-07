import { Component, OnInit } from '@angular/core';

// Services --------------------------------------------
import { ThemeService } from '../../../services/theme-service';

// End Services

import { SemsService } from 'src/app/services/sems-service';

@Component({
  selector: 'app-total-weather-board',
  templateUrl: './total-weather-board.component.html',
  styleUrls: ['./total-weather-board.component.scss']
})
export class TotalWeatherBoardComponent implements OnInit {
  date: Date = new Date();
  data = null;
  dateFormat = {
    'DAILY': 'yyyy-MM-dd',
    'YEARLY': 'yyyy',
    'MONTHLY': 'yyyy-MM'
  }

  constructor(public themeService: ThemeService,
    private semsService: SemsService
  ) {

  }

  ngOnInit(): void {
    this.date = new Date('2021-10-27');

    this.semsService.getWeatherStatRadiation(this.date)
      .subscribe(res => {
        console.log(res);

        this.data = res;
        console.log(this.data[2]);
        console.log(this.data[0].summary[0].eday / this.data[0].summary[1].eday * 100);
      })
  }

}
