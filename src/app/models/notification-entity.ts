import { AttachmentEntity } from "./attachment-entity";
import { UserEntity } from "./user-entity";

export class NotificationEntity {
  public id: number | undefined;

  public title: string | undefined;
  public description: string | undefined;
  public user: UserEntity | undefined;
  public createDate: Date | undefined;
  public updateDate: Date | undefined;

  public attachment: Array<AttachmentEntity> | undefined;
}