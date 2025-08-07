export class InvertorPower {
  public invId: number | undefined;

  public insName: string | undefined;
  public insNum: Int16Array | undefined;
  public siteName: string | undefined;

  public dcv1: Float32Array | undefined;
  public dcv2: Float32Array | undefined;
  public dcv3: Float32Array | undefined;
  public dcv4: Float32Array | undefined;
  public dcv5: Float32Array | undefined;
  public dcv6: Float32Array | undefined;
  public dcv7: Float32Array | undefined;
  public dcv8: Float32Array | undefined;
  public dcv9: Float32Array | undefined;
  public dcv10: Float32Array | undefined;

  public dca1: Float32Array | undefined;
  public dca2: Float32Array | undefined;
  public dca3: Float32Array | undefined;
  public dca4: Float32Array | undefined;
  public dca5: Float32Array | undefined;
  public dca6: Float32Array | undefined;
  public dca7: Float32Array | undefined;
  public dca8: Float32Array | undefined;
  public dca9: Float32Array | undefined;
  public dca10: Float32Array | undefined;

  public efficiency: Float32Array | undefined;

  public power: Float32Array | undefined;
  public tempInner: Float32Array | undefined;
  public frequency: Float32Array | undefined;
  public status: Int16Array | undefined;
  public message: Int16Array | undefined;
}