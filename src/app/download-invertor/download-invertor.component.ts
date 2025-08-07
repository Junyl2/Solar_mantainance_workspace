import { Component, OnInit } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment';
import { SemsService } from '../services/sems-service';
import { Invertor } from '../models/invertor';
import { InvertorSelect } from '../models/invertor-select';
import { saveAs } from 'file-saver';
import {OntestUtils} from "../utils/ontest-utils";
import {Optimizers} from "../models/optimizers";

@Component({
  selector: 'app-download-invertor',
  templateUrl: './download-invertor.component.html',
  styleUrls: ['./download-invertor.component.scss']
})
export class DownloadInvertorComponent implements OnInit {

  startDailyDate: Date;
  endDailyDate: Date;
  startMinDailyDate: Date;
  startMaxDailyDate: Date;
  endMinDailyDate: Date;
  endMaxDailyDate: Date;

  public showProgressSpinner: boolean = false;

  invertors: Invertor[];
  optimizers: Optimizers[];
  facilities: { id: number, title: string, selected: boolean }[];
  optimizersFacilities: { id: number, title: string, selected: boolean }[];
  invertorSelect: InvertorSelect = new InvertorSelect();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  constructor(private semsService: SemsService) {

  }

  ngOnInit(): void {
    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate = this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = moment().toDate();

    this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();
    // let ontestUtils = new OntestUtils();
    this.semsService.getSite().subscribe(siteRes => {
      this.semsService.getInvertorList()
        .subscribe(res => {
          this.facilities = this.onTestUtil.facilities;
          for (let facility of this.facilities) {
            facility.selected = true;
          }
          this.invertors = res;
          console.log(res);

          for (let i = 0; i < this.invertors.length; i++) {
            this.invertors[i].selected = true;

            let invertorName = '';

            if (siteRes && siteRes.siteHardware && siteRes?.siteHardware.length > 0) {
              for (let j = 0; j < siteRes.siteHardware.length; j++) {
                if (siteRes.siteHardware[j].insName == this.invertors[i].insName && siteRes.siteHardware[j].insNum == this.invertors[i].insNum) {
                  invertorName = siteRes.siteHardware[j].name;
                  break;
                }
              }
            }

            if (invertorName.length == 0) {
              invertorName = `${this.invertors[i].insName}[${this.invertors[i].insNum}]`;
            }

            this.invertors[i].name = invertorName;
          }

          console.log(this.invertors);
        })

    })
  }

  // 입력 DC 선택
  toggleCheckbox($event, key) {
    this.invertorSelect[key] = $event.checked;
  }

  toggleAll($event, selected) {
    let result = true;

    for (const key in this.invertorSelect) {
      if (key != selected && key.startsWith(selected)) {
        result = this.invertorSelect[key] && result;
      }

      if (!result) {
        break;
      }
    }

    for (const key in this.invertorSelect) {
      if (key != selected && key.startsWith(selected)) {
        this.invertorSelect[key] = !result;
      }
    }
  }

  checkAll(selected: string) {
    let result = true;

    for (const key in this.invertorSelect) {
      if (key != selected && key.startsWith(selected)) {
        result = this.invertorSelect[key] && result;
      }

      if (!result) {
        break;
      }
    }

    this.invertorSelect[selected] = result;
  }


  checkAllAca($event, isAll) {
    if (isAll) {
      this.invertorSelect.acaT = $event.checked;
      this.invertorSelect.acaR = $event.checked;
      this.invertorSelect.acaS = $event.checked;
    } else {
      this.invertorSelect.aca = this.invertorSelect.acaT && this.invertorSelect.acaR && this.invertorSelect.acaS;
    }
  }


  checkAllAcv($event, isAll) {
    if (isAll) {
      this.invertorSelect.acvTR = $event.checked;
      this.invertorSelect.acvRS = $event.checked;
      this.invertorSelect.acvST = $event.checked;
    } else {
      this.invertorSelect.acv = this.invertorSelect.acvTR && this.invertorSelect.acvRS && this.invertorSelect.acvST;
    }
  }

  toggleAllEtc($event) {
    let result = this.invertorSelect.eday && this.invertorSelect.accumulatePower && this.invertorSelect.power && this.invertorSelect.tempInner && this.invertorSelect.frequency && this.invertorSelect.status && this.invertorSelect.message && this.invertorSelect.efficiency;
    console.log(result);

    this.invertorSelect.eday = this.invertorSelect.accumulatePower = this.invertorSelect.power = this.invertorSelect.tempInner = this.invertorSelect.frequency = this.invertorSelect.status = this.invertorSelect.message  = this.invertorSelect.efficiency = this.invertorSelect.etc = !result;
  }

  checkAllEtc() {
    let result = this.invertorSelect.eday && this.invertorSelect.accumulatePower && this.invertorSelect.power && this.invertorSelect.tempInner && this.invertorSelect.frequency && this.invertorSelect.status && this.invertorSelect.message && this.invertorSelect.efficiency;

    this.invertorSelect.etc = result;
  }

  download() {
    this.showProgressSpinner = true;

    this.semsService.downloadInvertorData(this.startDailyDate, this.endDailyDate, this.invertors, this.invertorSelect)
      .subscribe(res => {
        this.showProgressSpinner = false;

        saveAs(res, `invertor-download-${moment(moment.now()).toISOString()}.xlsx`);
      })
  }

  showProgressOverlay() {
    console.log('show progress');
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    this.startDailyDate = normalizedDate.toDate();
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.toDate();
  }


  selectInvertor(insName, insNum) {
    console.log(insName);
    console.log(insNum);
    console.log(this.invertors);
  }


  selectFacility(facility: {id: number; title: string; selected: boolean}) {
    console.log(facility);
    for (let invertor of this.invertors) {
      if (invertor.facilityId == facility.id) {
        invertor.selected = facility.selected;
      }
    }
  }


  selectOptimizer(insName, insNum) {
    console.log(this.invertors);
  }

  selectOptimizerFacility(facility: {id: number; title: string; selected: boolean}) {
    console.log(facility);
    for (let optimizer of this.optimizers) {
      if (optimizer.facilityId == facility.id) {
        optimizer.selected = facility.selected;
      }
    }
  }
}
