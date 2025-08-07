import {Facility} from "./facility";

export class WeatherSelect {
  public temperature: boolean = false;
  public wd: boolean = false;
  public ws: boolean = false;
  public humidity: boolean = false;
  public irradiance: boolean = false;
  public eday: boolean = false;
  public status: boolean = false;
  public all: boolean = false;
  public startDate: Date | string;
  public endDate: Date | string;
  public facilityIds: string[];
}
