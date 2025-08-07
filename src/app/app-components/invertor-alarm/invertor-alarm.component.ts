import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

// Angular Material Datepicker
import { MatDatepicker } from '@angular/material/datepicker';
import moment, { Moment } from 'moment';

import { SemsService } from 'src/app/services/sems-service';

@Component({
  selector: 'app-invertor-alarm',
  templateUrl: './invertor-alarm.component.html',
  styleUrls: ['./invertor-alarm.component.scss']
})
export class InvertorAlarmComponent implements OnInit {

  collection = { count: 10, data: [] }

  config = {
    id: 'custom',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  }

  startDate: Date = new Date();
  startMinDate!: Date;
  startMaxDate!: Date;
  endDate: Date = new Date();
  endMinDate! : Date;
  endMaxDate!: Date;

  constructor(
    private router: Router,
    private semsService: SemsService
  ) { 
    this.startMinDate = this.endMinDate = this.semsService.getInstalledDate();
    this.startMaxDate = this.endMaxDate = this.endDate = moment().toDate();
    this.startDate = moment().add(-1, 'M').toDate();
  }

  search = () => {

  }

  close = () => {
    this.router.navigate(['/efficiency'])
  }

  ngOnInit(): void {
    this.updatePage();
  }

  onStartDateSelected(normalizedDate: Moment) {
    this.startDate = normalizedDate.toDate();
  }

  onEndDateSelected(normalizedDate: Moment) {
    this.endDate = normalizedDate.toDate();
  }

  updatePage() {
    this.semsService.getInvertorErrorList(this.startDate, this.endDate).subscribe(res => {
      console.log(res.content);

      this.collection.data = res.content;
      this.config.itemsPerPage = res.pageable.pageSize;
      this.config.currentPage = res.pageable.pageNumber + 1;
      this.config.totalItems = res.totalElements;
    })
  }

  changePage (event: any): void {
    this.config.currentPage = event;
    console.log(event);
    console.log(this.startDate);
    console.log(this.endDate);

    this.semsService.getInvertorErrorList(null, null, event - 1, this.config.itemsPerPage).subscribe(res => {
      this.collection.data = res.content;
      this.config.itemsPerPage = res.pageable.pageSize;
      this.config.currentPage = res.pageable.pageNumber + 1;
      this.config.totalItems = res.totalElements;
    })
  }
}
