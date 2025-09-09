import { Component, OnInit } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment';
import { saveAs } from 'file-saver';

import { SemsService } from '../services/sems-service';
import { WeatherSelect } from '../models/weather-select';
import { Facility } from '../models/facility';

@Component({
  selector: 'app-download-weather',
  templateUrl: './download-weather.component.html',
  styleUrls: ['./download-weather.component.scss'],
})
export class DownloadWeatherComponent implements OnInit {
  // Dates
  startDailyDate!: Date;
  endDailyDate!: Date;
  startMinDailyDate!: Date;
  startMaxDailyDate!: Date;
  endMinDailyDate!: Date;
  endMaxDailyDate!: Date;

  // Data: facilities act as “inverters” for selection
  facilities: (Facility & { selected?: boolean })[] = [];
  facilityAll!: Facility & { selected?: boolean };

  // Selection models
  weatherSelect: WeatherSelect = new WeatherSelect();
  /** Plain object alias to avoid `(as any)` in templates */
  weatherAny: any = this.weatherSelect;

  // UI
  public showProgressSpinner = false;

  // Inverter list loading state
  loadingInverters = false;
  loadInvertersError: string | null = null;

  // DC groups index (1..10)
  dcvIdx = Array.from({ length: 10 }, (_, i) => i + 1);
  dcaIdx = Array.from({ length: 10 }, (_, i) => i + 1);

  constructor(private semsService: SemsService) {}

  ngOnInit(): void {
    // Daily bounds
    this.startMinDailyDate = this.semsService.getInstalledDate();
    this.endMinDailyDate = this.startMinDailyDate;
    this.startMaxDailyDate = moment().toDate();
    this.endMaxDailyDate = this.startMaxDailyDate;

    // Default range: last month to today
    this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();

    // Load site then facilities/inverters
    this.loadingInverters = true;
    this.loadInvertersError = null;

    this.semsService.getSite().subscribe({
      next: () => {
        this.semsService.getWeatherInvertorList().subscribe({
          next: (res: Facility[] = []) => {
            // ---- DEBUG LOGS ----
            console.log(
              '%c[getWeatherInvertorList] raw response:',
              'color:#0aa;',
              res
            );
            console.log(
              '[getWeatherInvertorList] length:',
              Array.isArray(res) ? res.length : 'not an array'
            );
            if (Array.isArray(res) && res.length > 0) {
              console.log('[getWeatherInvertorList] sample row:', res[0]);
            }
            // ---------------------

            this.facilities = (res ?? []).map((f) => ({
              ...f,
              selected: true,
            }));
            this.facilityAll = {
              id: 0,
              title: '전체',
              selected: true,
            } as Facility & {
              selected?: boolean;
            };
            this.loadingInverters = false;
          },
          error: (err) => {
            this.loadingInverters = false;
            this.loadInvertersError = '인버터 목록을 불러오지 못했습니다.';
            console.error('[getWeatherInvertorList] ERROR:', err);
          },
        });
      },
      error: (err) => {
        this.loadingInverters = false;
        this.loadInvertersError = '사이트 정보를 불러오지 못했습니다.';
        console.error('[getSite] ERROR:', err);
      },
    });
  }

  // -------- Label helper (index-signature safe) --------
  displayFacilityLabel(f: Facility): string {
    const anyF = f as unknown as { [key: string]: unknown };
    const name =
      (anyF['insName'] as string | undefined) ??
      f.title ??
      (anyF['name'] as string | undefined) ??
      `인버터 ${f.id}`;
    const num = anyF['insNum'] as string | number | undefined;
    return num != null && String(num).length > 0 ? `${name} (${num})` : name;
  }

  // -------- Meteorological toggles --------
  toggleCheckbox($event: { checked: boolean }, key: string) {
    this.weatherAny[key] = $event.checked;
  }

  toggleAllWeather() {
    const allOn =
      !!this.weatherAny.temperature &&
      !!this.weatherAny.wd &&
      !!this.weatherAny.ws &&
      !!this.weatherAny.humidity &&
      !!this.weatherAny.irradiance &&
      !!this.weatherAny.eday;

    const target = !allOn;
    this.weatherAny.temperature = target;
    this.weatherAny.wd = target;
    this.weatherAny.ws = target;
    this.weatherAny.humidity = target;
    this.weatherAny.irradiance = target;
    this.weatherAny.eday = target;
    this.weatherAny.all = target;
  }

  checkAllWeather() {
    const allOn =
      !!this.weatherAny.temperature &&
      !!this.weatherAny.wd &&
      !!this.weatherAny.ws &&
      !!this.weatherAny.humidity &&
      !!this.weatherAny.irradiance &&
      !!this.weatherAny.eday;
    this.weatherAny.all = allOn;
  }

  // -------- DC group toggles (dcv*, dca*) --------
  toggleAllGroup(groupPrefix: 'dcv' | 'dca') {
    const idxs = groupPrefix === 'dcv' ? this.dcvIdx : this.dcaIdx;
    let allOn = true;
    for (const i of idxs)
      allOn = allOn && !!this.weatherAny[`${groupPrefix}${i}`];
    const target = !allOn;
    for (const i of idxs) this.weatherAny[`${groupPrefix}${i}`] = target;
    this.weatherAny[groupPrefix] = target;
  }

  checkAllGroup(groupPrefix: 'dcv' | 'dca') {
    const idxs = groupPrefix === 'dcv' ? this.dcvIdx : this.dcaIdx;
    let allOn = true;
    for (const i of idxs)
      allOn = allOn && !!this.weatherAny[`${groupPrefix}${i}`];
    this.weatherAny[groupPrefix] = allOn;
  }

  // -------- Facilities (UI binding + select-all) --------
  selectFacility(
    _event: { checked: boolean },
    _id: number | null,
    isAll: boolean
  ) {
    if (isAll) {
      const target = !!this.facilityAll?.selected;
      for (const f of this.facilities) f.selected = target;
    } else {
      const allOn =
        this.facilities.length > 0 &&
        this.facilities.every((f) => !!f.selected);
      if (this.facilityAll) this.facilityAll.selected = allOn;
    }
  }

  // -------- Download --------
  download() {
    const selected = this.facilities.filter((f) => !!f.selected);
    const finalFacilities = selected.length ? selected : this.facilities;

    this.showProgressSpinner = true;

    this.semsService
      .downloadWeatherData(
        this.startDailyDate,
        this.endDailyDate,
        finalFacilities,
        this.weatherAny
      )
      .subscribe({
        next: (res) => {
          this.showProgressSpinner = false;

          let blob: Blob;

          if (res instanceof Blob) {
            blob = res;
          } else if (Array.isArray(res)) {
            blob = new Blob([new Uint8Array(res as number[])], {
              type: 'application/octet-stream',
            });
          } else {
            blob = new Blob([res as any], { type: 'application/octet-stream' });
          }

          saveAs(blob, `weather-download-${moment().toISOString()}.xlsx`);
        },
        error: () => {
          this.showProgressSpinner = false;
          console.error('Failed to download weather data');
        },
      });
  }

  // -------- Date handlers --------
  onStartDailyDaySelected(normalizedDate: Moment | Date | null) {
    if (!normalizedDate) return;
    this.startDailyDate =
      (normalizedDate as Moment).toDate?.() ??
      moment(normalizedDate as Date).toDate();
  }

  onEndDailyDaySelected(normalizedDate: Moment | Date | null) {
    if (!normalizedDate) return;
    this.endDailyDate =
      (normalizedDate as Moment).toDate?.() ??
      moment(normalizedDate as Date).toDate();
  }
}
