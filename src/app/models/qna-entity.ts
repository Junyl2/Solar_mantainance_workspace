import { UserEntity } from "./user-entity";

export class QnAEntity {
  public id: number | undefined;

  public title: string | undefined;
  public content: string | undefined;
  public reply: string | undefined;
  public user: UserEntity | undefined;

  // QnA user data
  public email: string | undefined;
  public name: string | undefined;
  public tel: string | undefined;

  public createDate: Date | undefined;
  public updateDate: Date | undefined;
}