import { Component } from '@angular/core';

import { SemsService } from '../../services/sems-service';

@Component({
  selector: 'setting',
  templateUrl: './setting.component.html',
  styleUrls: ['./setting.component.css']
})
export class SettingComponent {
  date!: Date;
  constructor(private semsService: SemsService) {
    this.date = this.semsService.getInstalledDate();
  }
}
