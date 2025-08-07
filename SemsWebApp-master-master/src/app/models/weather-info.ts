export class WeatherInfo {
  public siteName: string | undefined;
  public insNum: Int16Array | undefined;
  public insName: string | undefined;

  public dateTime: string | undefined;

  public temperature: Float32Array | undefined;
  public wd: Float32Array | undefined;
  public ws: Float32Array | undefined;
  public humidity: Float32Array | undefined;
  public irradiance: Float32Array | undefined;
  public status: Int16Array | undefined;
}