import { Component, OnInit } from '@angular/core'
import { UserEntity } from 'src/app/models/user-entity'
import { SemsService } from 'src/app/services/sems-service'

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss']
})
export class QuestionComponent implements OnInit {
  collection = { count: 10, data: [] }
  user: UserEntity;

  config = {
    id: 'custom',
    itemsPerPage: 10,
    currentPage: 1,
    totalItems: 0
  }

  public maxSize: number = 7
  public directionLinks: boolean = true
  public autoHide: boolean = false
  public responsive: boolean = true
  public labels: any = {
    previousLabel: '<--',
    nextLabel: '-->',
    screenReaderPaginationLabel: 'Pagination',
    screenReaderPageLabel: 'page',
    screenReaderCurrentLabel: `You're on page`
  }

  constructor (private semsService: SemsService) {}

  ngOnInit (): void {
    this.user = JSON.parse(localStorage.getItem('account'));
    console.log(this.user);

    this.semsService.getQnAListByUserId(this.user.id).subscribe(res => {
      console.log(res)

      this.collection.data = res.content
      this.config.itemsPerPage = res.pageable.pageSize
      this.config.currentPage = res.pageable.pageNumber + 1
      this.config.totalItems = res.totalElements
    })
  }

  // Change page
  changePage (event: any): void {
    this.config.currentPage = event;
    console.log(event);

    this.semsService.getQnAList(event - 1, this.config.itemsPerPage).subscribe(res => {
      this.collection.data = res.content
      this.config.itemsPerPage = res.pageable.pageSize
      this.config.currentPage = res.pageable.pageNumber + 1
      this.config.totalItems = res.totalElements
    })
  }

  ngAfterContentChecked (): void {}

  ngAfterViewInit (): void {}
}
