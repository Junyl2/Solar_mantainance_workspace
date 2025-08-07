import { Invertor } from "./invertor";

export class InvertorSummary {
  public insName: string | undefined;
  public insNum: string | undefined;

  public facilityId: number | undefined;
  public facilityTitle: string | undefined;

  public name: string | undefined;

  // data element for chart
  public data: number[] | undefined;
  // data element for table
  public invertorSummary: Array<Invertor> | undefined;
  public monthlyAvg: Invertor | undefined;
}
