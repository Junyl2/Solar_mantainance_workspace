export class Invertor {
  public siteName: string | undefined;
  public facilityId: number | undefined;
  public insNum: Int16Array | undefined;
  public insName: string | undefined;
  public name: string | undefined;

  public dateTime: string | undefined;

  public powerAvg: Float32Array | undefined;
  public acvRAvg: Float32Array | undefined;
  public efficiency: Float32Array | undefined;

  public powerIrradiance: Float32Array | undefined;
  public irradianceAvg: Float32Array | undefined;

  public selected: boolean = true;
}
