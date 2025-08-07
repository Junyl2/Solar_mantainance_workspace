import { SiteEntity } from "./site-entity";

export class UserEntity {
  public id: number | undefined;
  public account: string | undefined;
  public tel: string | undefined;
  public email: string | undefined;
  public customer: string | undefined;

  public oldPassword: string | undefined;
  public newPassword: string | undefined;
  public checkPassword: string | undefined;

  public site: SiteEntity | undefined;
}