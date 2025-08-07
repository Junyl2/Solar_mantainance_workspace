import { Component, OnInit } from '@angular/core';
import { SemsService } from 'src/app/services/sems-service';

@Component({
  selector: 'app-notice-board',
  templateUrl: './notice-board.component.html',
  styleUrls: ['./notice-board.component.scss']
})
export class NoticeBoardComponent implements OnInit {

  collection = { count: 10, data: [] };

  config = {
    id: 'custom',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 100,
  };

  constructor(private semsService : SemsService) { }

  ngOnInit(): void {
    this.semsService.getNotificationList()
      .subscribe(res => {
        console.log(res);

        this.collection.data = res.content;
        this.config.itemsPerPage = res.pageable.pageSize;
        this.config.currentPage = res.pageable.pageNumber + 1;
        this.config.totalItems = res.totalElements;
      })
  }

}
