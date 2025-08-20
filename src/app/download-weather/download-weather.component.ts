import { Component, OnInit } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment';
import { SemsService } from '../services/sems-service';
import { Invertor } from '../models/invertor';
import { WeatherSelect } from '../models/weather-select';
import { saveAs } from 'file-saver';
import { Facility } from '../models/facility';

@Component({
  selector: 'app-download-weather',
  templateUrl: './download-weather.component.html',
  styleUrls: ['./download-weather.component.scss'],
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

  constructor(private semsService: SemsService) {}

  ngOnInit(): void {
    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate =
      this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = moment().toDate();

    this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();
    this.semsService.getSite().subscribe((siteRes) => {
      console.log(siteRes);
      this.semsService.getWeatherInvertorList().subscribe((res) => {
        console.log(res);
        this.facilities = res;
        for (let f of this.facilities) {
          f.selected = true;
        }
        this.facilityAll = new Facility();
        this.facilityAll.selected = true;
      });
    });
  }

  toggleCheckbox($event: any, key: string) {
    this.weatherSelect[key] = $event.checked;
  }

  toggleAll() {
    let result =
      this.weatherSelect.temperature &&
      this.weatherSelect.wd &&
      this.weatherSelect.ws &&
      this.weatherSelect.humidity &&
      this.weatherSelect.irradiance &&
      this.weatherSelect.eday;
    console.log(result);

    this.weatherSelect.temperature =
      this.weatherSelect.wd =
      this.weatherSelect.ws =
      this.weatherSelect.humidity =
      this.weatherSelect.irradiance =
      this.weatherSelect.eday =
      this.weatherSelect.all =
        !result;
  }

  checkAll() {
    let result =
      this.weatherSelect.temperature &&
      this.weatherSelect.wd &&
      this.weatherSelect.ws &&
      this.weatherSelect.humidity &&
      this.weatherSelect.irradiance &&
      this.weatherSelect.eday;

    this.weatherSelect.all = result;
  }

  download() {
    this.showProgressSpinner = true;

    this.semsService
      .downloadWeatherData(
        this.startDailyDate,
        this.endDailyDate,
        this.facilities,
        this.weatherSelect
      )
      .subscribe({
        next: (res: any) => {
          this.showProgressSpinner = false;
          console.log(moment(moment.now()).toISOString());

          // 타입 안전한 파일 저장
          this.saveFile(
            res,
            `weather-download-${moment(moment.now()).toISOString()}.xlsx`
          );
        },
        error: (error) => {
          this.showProgressSpinner = false;
          console.error('다운로드 중 오류 발생:', error);
        },
      });
  }

  // 파일 저장을 위한 별도 메서드 추가
  private saveFile(data: any, filename: string) {
    try {
      // Case 1: 이미 Blob인 경우
      if (data instanceof Blob) {
        saveAs(data, filename);
        return;
      }

      // Case 2: ArrayBuffer인 경우
      if (data instanceof ArrayBuffer) {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, filename);
        return;
      }

      // Case 3: 문자열인 경우
      if (typeof data === 'string') {
        const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
        saveAs(blob, filename);
        return;
      }

      // Case 4: 배열이나 객체인 경우 (JSON으로 변환)
      if (Array.isArray(data) || typeof data === 'object') {
        // Excel 파일로 저장하려면 적절한 형식으로 변환
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], {
          type: 'application/json;charset=utf-8',
        });
        // .xlsx 대신 .json 확장자 사용
        const jsonFilename = filename.replace('.xlsx', '.json');
        saveAs(blob, jsonFilename);
        return;
      }

      // Case 5: 기본값 - Blob으로 강제 변환
      const blob = new Blob([data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, filename);
    } catch (error) {
      console.error('파일 저장 중 오류 발생:', error);
      // 최후의 수단: 타입 캐스팅 사용
      saveAs(data as Blob, filename);
    }
  }

  selectFacilityAll($event: any) {
    for (let facility of this.facilities) {
      // facility.selected = $event;
    }
  }

  selectFacility($event: any, id: any, isAll: boolean) {
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
