import { WeatherInfo } from "./weather-info";

export class WeatherInfoSummary {
  public insName: string | undefined;
  public insNum: string | undefined;
  public name: string | undefined;

  // data element for chart
  public data: number[] | undefined;
  // data element for API response
  public invertorWeatherSummary: Array<WeatherInfo> | undefined;
}