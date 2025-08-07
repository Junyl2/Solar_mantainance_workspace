import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QnAEntity } from 'src/app/models/qna-entity';
import { SemsService } from 'src/app/services/sems-service';

@Component({
  selector: 'app-question-detail',
  templateUrl: './question-detail.component.html',
  styleUrls: ['./question-detail.component.scss']
})
export class QuestionDetailComponent implements OnInit {
  data!: QnAEntity;

  constructor(private router: Router, private route: ActivatedRoute, private semsService: SemsService) { }

  async delete() {
    console.log(this.data);
    console.log('delete');

    this.semsService.deleteQnA(this.data.id).subscribe(res => {
      this.router.navigate(['/question']);
    })
  }

  ngOnInit(): void {
    /*
    this.data = {
      id: 1,
      title: '모니터링 문의',
      content: '문의내용 \n\n' +
      '서비스를 이용해 주시는 이용자 여러분께 감사드리며, 새로운 개인정보 처리방침 적용에 관한 안내 말씀 드립니다\n\n' +
      '회사는 이용자 여러분의 개인정보를 무엇보다 소중하게 처리하고 있으며, 어떤 사안보다도 우선하여 안전하게 관리하고 있습니다. \n\n' +
      '새롭게 변경될 개인정보 처리방침 내용을 확인하시고 서비스 이용에 참고하시기 바랍니다.\n',
      user: {
        id: 1,
        account: 'babyalpha',
        tel: '010-4211-3595',
        email: 'test',
      },
      reply: '서비스를 이용해 주시는 이용자 여러분께 감사드리며, 새로운 개인정보 처리방침 적용에 관한 안내 말씀 드립니다',
      createDate: new Date('2022-02-05T06:19:09.702+00:00'),
      updateDate: new Date('2022-02-05T06:19:09.702+00:00'),
    }
    */

    const routeParams = this.route.snapshot.paramMap;

    console.log(routeParams.get('id'));
    const qnaId = Number(routeParams.get('id'));

    this.semsService.getQnADetail(qnaId).subscribe(res => {
      this.data = res;
      console.log(this.data);
    })
  }

}
