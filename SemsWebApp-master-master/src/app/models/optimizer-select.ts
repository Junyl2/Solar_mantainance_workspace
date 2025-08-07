export class OptimizerSelect {
  public dcv: boolean = false;              // 전압
  public dca: boolean = false;              // 전류
  public dc: boolean = false;
  public eday: boolean = false;             // 금일 발전량
  public accumulatePower: boolean = false;  // 누적 발전량
  public power: boolean = false;            // 현재 발전량
  public status: boolean = false;           // 동작상태
  public tempPv: boolean = false;           // PV후면온도
  public tempExt: boolean = false;          // 건물외벽온도
  public tempAmb: boolean = false;          // 공기중온도
  public etc: boolean = false;
}
