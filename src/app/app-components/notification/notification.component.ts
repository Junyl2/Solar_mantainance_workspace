import {
  AfterContentChecked,
  AfterViewInit,
  Component,
  OnInit
} from '@angular/core'
import { ColDef } from 'ag-grid-community'
import { Observable, of } from 'rxjs'
import { SemsService } from 'src/app/services/sems-service';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.scss']
})
export class NotificationComponent
  implements OnInit, AfterViewInit, AfterContentChecked {
  columnDefs: ColDef[] = [
    { headerName: 'Make', field: 'make' },
    { headerName: 'Model', field: 'model' },
    { headerName: 'Price', field: 'price' }
  ]

  collection = { count: 10, data: [] };

  config = {
    id: 'custom',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 100,
  };

  public maxSize: number = 7;
  public directionLinks: boolean = true;
  public autoHide: boolean = false;
  public responsive: boolean = true;
  public labels: any = {
      previousLabel: '<--',
      nextLabel: '-->',
      screenReaderPaginationLabel: 'Pagination',
      screenReaderPageLabel: 'page',
      screenReaderCurrentLabel: `You're on page`
  };

  constructor (private semsService : SemsService) {}

  ngOnInit (): void {
    this.semsService.getNotificationList()
      .subscribe(res => {
        console.log(res);

        this.collection.data = res.content;
        this.config.itemsPerPage = res.pageable.pageSize;
        this.config.currentPage = res.pageable.pageNumber + 1;
        this.config.totalItems = res.totalElements;
      })
  }

  // Change page
  changePage (event: any): void {
    this.config.currentPage = event;
    console.log(event);

    this.semsService.getNotificationList(event - 1, this.config.itemsPerPage).subscribe(res => {
      this.collection.data = res.content
      this.config.itemsPerPage = res.pageable.pageSize
      this.config.currentPage = res.pageable.pageNumber + 1
      this.config.totalItems = res.totalElements
    })
  }

  ngAfterContentChecked (): void {}

  ngAfterViewInit (): void {}

  fetchData () {
    return of([
      { make: 'Toyota', model: 'Celica', price: 35000 },
      { make: 'Toyota', model: 'Celica', price: 35000 },
      { make: 'Toyota', model: 'Celica', price: 35000 }
    ])
  }
}
