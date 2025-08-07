

export class SolorSystem {

  public Arrays: Array<boolean> = [true, true, true, true, true, true, false, false, false, false];
  public References: Array<boolean> = [false, false, false, true, true, false, false, false, false, false];

  constructor() {

  }
  public SelectArray(index:number, check:boolean) {
    this.Arrays[index] = check;
  }
}
