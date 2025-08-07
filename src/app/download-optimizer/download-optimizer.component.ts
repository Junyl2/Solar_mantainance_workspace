import { Component, OnInit } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment';
import { SemsService } from '../services/sems-service';
import { Invertor } from '../models/invertor';
import { InvertorSelect } from '../models/invertor-select';
import { saveAs } from 'file-saver';
import {OntestUtils} from "../utils/ontest-utils";
import {Optimizers} from "../models/optimizers";
import {OptimizerSelect} from "../models/optimizer-select";

@Component({
  selector: 'app-download-invertor',
  templateUrl: './download-optimizer.component.html',
  styleUrls: ['./download-optimizer.component.scss']
})
export class DownloadOptimizerComponent implements OnInit {

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
  optimizerSelect: OptimizerSelect = new OptimizerSelect();
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
      this.semsService.getOptimizerList()
        .subscribe(res => {
          this.optimizersFacilities = JSON.parse(JSON.stringify(this.onTestUtil.facilities));
          for (let facility of this.optimizersFacilities) {
            facility.selected = true;
          }
          this.optimizers = res;
          for (let i = 0; i < this.optimizers.length; i++) {
            this.optimizers[i].selected = true;
          }
          console.log(this.optimizers);
        })

    })
  }

  // 입력 DC 선택
  toggleCheckbox($event, key) {
    this.optimizerSelect[key] = $event.checked;
  }

  toggleAllDC($event, isAll) {
    if (isAll) {
      this.optimizerSelect.dca = $event.checked;
      this.optimizerSelect.dcv = $event.checked;
    } else {
      this.optimizerSelect.dc = this.optimizerSelect.dca && this.optimizerSelect.dcv;
    }
  }

  toggleAllEtc($event) {
    let result = this.optimizerSelect.eday && this.optimizerSelect.accumulatePower && this.optimizerSelect.power && this.optimizerSelect.tempPv && this.optimizerSelect.tempExt && this.optimizerSelect.status && this.optimizerSelect.tempAmb;
    console.log(result);

    this.optimizerSelect.eday = this.optimizerSelect.accumulatePower = this.optimizerSelect.power = this.optimizerSelect.tempPv = this.optimizerSelect.tempExt = this.optimizerSelect.status = this.optimizerSelect.tempAmb = this.optimizerSelect.etc = !result;
  }

  checkAllEtc() {
    let result = this.optimizerSelect.eday && this.optimizerSelect.accumulatePower && this.optimizerSelect.power && this.optimizerSelect.tempPv && this.optimizerSelect.tempExt && this.optimizerSelect.status && this.optimizerSelect.tempAmb;

    this.optimizerSelect.etc = result;
  }

  download() {
    this.showProgressSpinner = true;

    this.semsService.downloadPvData(this.startDailyDate, this.endDailyDate, this.optimizers, this.optimizerSelect)
      .subscribe(res => {
        this.showProgressSpinner = false;

        saveAs(res, `pv-download-${moment(moment.now()).toISOString()}.xlsx`);
      })
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    this.startDailyDate = normalizedDate.toDate();
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.toDate();
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
