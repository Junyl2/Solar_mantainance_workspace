import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { QnAEntity } from 'src/app/models/qna-entity';
import { UserEntity } from 'src/app/models/user-entity';
import { SemsService } from 'src/app/services/sems-service';

@Component({
  selector: 'app-question-register',
  templateUrl: './question-register.component.html',
  styleUrls: ['./question-register.component.scss']
})
export class QuestionRegisterComponent implements OnInit {
  @Input() data!: QnAEntity;

  constructor(private router: Router, private semsService: SemsService) { }

  ngOnInit(): void {
    this.data = new QnAEntity();
    this.data.user = new UserEntity();

    this.data.user = JSON.parse(localStorage.getItem('account'));

    this.data.email = this.data.user.email;
    this.data.name = this.data.user.account;
    this.data.tel = this.data.user.tel;
  }

  register(): void {
    console.log('register');

    console.log(this.data);

    this.semsService.postQnA(this.data).subscribe(res => {
      console.log(res);
      this.router.navigate(['/question']);
    })
  }
}
