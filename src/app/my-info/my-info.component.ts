import { Component, OnInit } from '@angular/core';
import { UserEntity } from '../models/user-entity';
import { SemsService } from '../services/sems-service';

@Component({
  selector: 'app-my-info',
  templateUrl: './my-info.component.html',
  styleUrls: ['./my-info.component.scss']
})
export class MyInfoComponent implements OnInit {
  user: UserEntity | undefined;

  constructor(private semsService: SemsService) { }

  ngOnInit(): void {
    this.user = JSON.parse(localStorage.getItem('account'));
    console.log(this.user);
  }

  changePassword(): void {
    if(this.user.newPassword != this.user.checkPassword) {
      alert('신규 비밀번호를 확인하세요.');
    } else if(!this.user.oldPassword) {
      alert('비밀번호를 입력하세요');
    } else if(!this.user.newPassword) {
      alert('신규 비밀번호를 입력하세요');
    } else {
      this.semsService.changePassword(this.user)
        .subscribe(res => {
          alert('비말번호가 변경되었습니다.');
        })
      ;
    }
  }
}
