import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NotificationEntity } from 'src/app/models/notification-entity';
import { SemsService } from 'src/app/services/sems-service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-notification-detail',
  templateUrl: './notification-detail.component.html',
  styleUrls: ['./notification-detail.component.scss']
})
export class NotificationDetailComponent implements OnInit {
  data! : NotificationEntity;
  url: string = `${environment.imageUrl}`;

  constructor(private route: ActivatedRoute, private semsService: SemsService) { }

  ngOnInit(): void {
    const routeParams = this.route.snapshot.paramMap;

    const notificationId = Number(routeParams.get('id'));

    this.semsService.getNotificationDetail(notificationId).subscribe(res => {
      console.log(res);

      this.data = res;
    })
  }

  getImageUrl(filePath, fileName) {
    let imageUrl = `${this.url}${filePath}/${fileName}`;

    return imageUrl;
  }
}
