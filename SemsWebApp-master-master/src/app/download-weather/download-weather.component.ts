import {Component, OnInit} from '@angular/core';
import {Moment} from 'moment';
import moment from 'moment';
import {SemsService} from '../services/sems-service';
import {Invertor} from '../models/invertor';
import {WeatherSelect} from '../models/weather-select';
import {saveAs} from 'file-saver';
import {Facility} from "../models/facility";

@Component({
  selector: 'app-download-weather',
  templateUrl: './download-weather.component.html',
  styleUrls: ['./download-weather.component.scss']
})
export class DownloadWeatherComponent implements OnInit {

  startDailyDate: Date;
  endDailyDate: Date;
  startMinDailyDate: Date;
  startMaxDailyDate: Date;
  endMinDailyDate: Date;
  endMaxDailyDate: Date;

  invertors: Invertor[];
  facilities: Facility[];
  facilityAll: Facility;
  weatherSelect: WeatherSelect = new WeatherSelect();

  public showProgressSpinner: boolean = false;

  constructor(private semsService: SemsService) {
  }

  ngOnInit(): void {
    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate = this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = moment().toDate();

    this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();
    this.semsService.getSite().subscribe(siteRes => {
      console.log(siteRes);
      this.semsService.getWeatherInvertorList()
        .subscribe(res => {
          console.log(res);
          this.facilities = res;
          for (let f of this.facilities) {
            f.selected = true;
          }
          this.facilityAll = new Facility();
          this.facilityAll.selected = true;
        })
    })
  }

  toggleCheckbox($event, key) {
    this.weatherSelect[key] = $event.checked;
  }

  toggleAll() {
    let result = this.weatherSelect.temperature && this.weatherSelect.wd && this.weatherSelect.ws && this.weatherSelect.humidity && this.weatherSelect.irradiance && this.weatherSelect.eday;
    console.log(result);

    this.weatherSelect.temperature = this.weatherSelect.wd = this.weatherSelect.ws = this.weatherSelect.humidity = this.weatherSelect.irradiance = this.weatherSelect.eday = this.weatherSelect.all = !result;
  }

  checkAll() {
    let result = this.weatherSelect.temperature && this.weatherSelect.wd && this.weatherSelect.ws && this.weatherSelect.humidity && this.weatherSelect.irradiance && this.weatherSelect.eday;

    this.weatherSelect.all = result;
  }

  download() {
    this.showProgressSpinner = true;

    this.semsService.downloadWeatherData(this.startDailyDate, this.endDailyDate, this.facilities, this.weatherSelect)
      .subscribe(res => {
        this.showProgressSpinner = false;

        console.log(moment(moment.now()).toISOString());

        saveAs(res, `weather-download-${moment(moment.now()).toISOString()}.xlsx`);
      })
  }


  selectFacilityAll($event) {
    for (let facility of this.facilities) {
      // facility.selected = $event;
    }
  }

  selectFacility($event, id, isAll) {
    if (isAll) {
      for (let facility of this.facilities) {
        facility.selected = $event.checked;
      }
    } else {
      let isSelectedAll = true;
      for (let facility of this.facilities) {
        if (!facility.selected) {
          isSelectedAll = false;
        }
      }
      this.facilityAll.selected = isSelectedAll;
    }
  }


  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    this.startDailyDate = normalizedDate.toDate();
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.toDate();
  }
}
