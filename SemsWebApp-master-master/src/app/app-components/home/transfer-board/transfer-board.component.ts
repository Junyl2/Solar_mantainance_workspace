import { AfterViewInit, Component, OnInit } from '@angular/core';


// Services
import { ThemeService } from '../../../services/theme-service';
import { SemsService } from '../../../services/sems-service';

import {
  faTint,
  faCloudSunRain,
  faSun,
  faTemperatureHigh,
  faWind,
  faLocationArrow,
  faBolt
} from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-transfer-board',
  templateUrl: './transfer-board.component.html',
  styleUrls: ['./transfer-board.component.scss']
})
export class TransferBoardComponent implements OnInit, AfterViewInit {
  faBolt = faBolt;
  constructor(public themeService: ThemeService, private semsService: SemsService) { }

  instances = [];
  maxDcv: number = 0;
  maxDca: number = 0;

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.semsService.getSite().subscribe(resSite => {
      this.semsService.getInvertorLastData()
        .subscribe(res => {
          for (let i = 0; i < res.length; i++) {
            let obj = Object.create(res[i]);

            let invertorName = '';

            console.log(resSite);

            if (resSite && resSite.siteHardware.length > 0) {
              for (let j = 0; j < resSite.siteHardware.length; j++) {
                if (resSite.siteHardware[j].insName == res[i].insName && resSite.siteHardware[j].insNum == res[i].insNum) {
                  invertorName = resSite.siteHardware[j].name;
                  break;
                }
              }
            }

            if (invertorName.length == 0) {
              invertorName = `${res[i].insName}[${res[i].insNum}]`;
            }

            const newInstance = {
              name: `${invertorName}`,
              dca: 0,
              dcv: 0,
              power: Math.floor(+res[i].power / 1000 * 100) / 100,
              frequency: res[i].frequency,
              efficiency: res[i].efficiency,
              status: res[i].status
            };

            for (let prop in obj) {
              if (prop.startsWith('dca') || prop.startsWith('dcv')) {
                if (res[i][prop] == 0) {
                  delete res[i][prop];
                } else if (prop.startsWith('dca')) {
                  newInstance.dca += res[i][prop];
                } else if (prop.startsWith('dcv')) {
                  newInstance.dcv += res[i][prop];
                }
              }
            }

            this.instances.push(newInstance);
          }

          console.log(this.instances);
        })
    });
  }

}
