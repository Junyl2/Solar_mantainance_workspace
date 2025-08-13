import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import moment from 'moment';
import { SemsService } from 'src/app/services/sems-service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sunlight-array-map',
  templateUrl: './sunlight-array-map.component.html',
  styleUrls: ['./sunlight-array-map.component.scss']
})
export class SunlightArrayMapComponent implements OnInit {

  @Output() selectedIndexChange: EventEmitter<number>;

  public sites: any[] = [];
  public selectedSiteIndex = 0;

  constructor(private semsService: SemsService) { }

  ngOnInit(): void {
    this.semsService.getSiteMapImage()
      .subscribe(res => {
         console.log('API response:', res);

      if (res && res.facility.length > 0) {
        const tempMap = new Map<string, any>();

        for (let facility of res.facility) {
          // Normalize title by stripping suffix after '-'
          const baseTitle = facility.title.split('-')[0].trim();

          // If baseTitle not yet added, add it
          if (!tempMap.has(baseTitle)) {
            let newFacility = { ...facility };
            newFacility.title = baseTitle;
            newFacility.imageUrl = `assets/site/${facility.filename}`;
            tempMap.set(baseTitle, newFacility);
          } else {
            // If needed, merge info or skip duplicates will be here
          }
        }

        // Convert map values to array for your sites
        this.sites = Array.from(tempMap.values());
      }

      console.log('Normalized sites:', this.sites);

        // 발전소 모듈 카운트
        for (let i = 0; i < this.sites.length; i++) {
          let site = this.sites[i];
          this.semsService.getHardwareCount(site.id)
            .subscribe(res => {
              //test
                  console.log(` Raw hardwareCount response for site ${site.id}:`, res);
              let resultObject: any = { invList: [], whether1Count: 0, whether2Count: 0, whether3Count: 0, whether4Count: 0, whether5Count: 0, whether6Count: 0, elecCount: 0 }
              let invObject = {};

              // 인버터 세팅
              // tmp 1 모듈전면 2 모듈후면 3 건물표면 4 공기층
              // pv 1: Dark Gray 2: Terra Cotta 3: White Gray
              for (let hardware of res) {
                if (hardware[0] === 0) {
                  invObject[hardware[4]] = { inv: [], pv1:[], pv2:[], pv3:[], pv1Object: {}, pv2Object: {}, pv3Object: {},
                    pvCount: 0, opt: [], tmp: { 1:[], 2:[], 3:[], 4:[] } };
                  invObject[hardware[4]].inv.push(hardware);
                }
              }

              // 용량별 PV 세팅
              for (let hardware of res) {
                if (hardware[0] === 5 && hardware[1] !== null && hardware[1] !== 0) {
                  if (hardware[1] === 1) {
                    if (invObject[hardware[5]] !== undefined) {
                      invObject[hardware[5]].pv1.push(hardware);
                    }
                  } else if (hardware[1] === 2) {
                    if (invObject[hardware[5]] !== undefined) {
                      invObject[hardware[5]].pv2.push(hardware);
                    }
                  } else if (hardware[1] === 3) {
                    if (invObject[hardware[5]] !== undefined) {
                      invObject[hardware[5]].pv3.push(hardware);
                    }
                  }
                }
              }

              // 옵티마이저 세팅
              for (let hardware of res) {
                if (hardware[0] === 3) {
                  if (invObject[hardware[5]] !== undefined) {
                    invObject[hardware[5]].opt.push(hardware);
                  }
                }
              }

              // 온도센서 세팅
              for (let hardware of res) {
                if (hardware[0] === 4 && hardware[2] !== 0) {
                  invObject[hardware[5]].tmp[hardware[2]].push(hardware);
                }
              }

              for(let i in invObject) {
                resultObject.invList.push(invObject[i]);
              }

              // PV 용량별 개수 GROUP BY
              for(let i of resultObject.invList) {
                let tempObject1 = {}
                let tempObject2 = {}
                let tempObject3 = {}
                let tempCount = 0;

                for (let j of i.pv1) {
                  if (tempObject1[j[3]] === undefined) {
                    tempObject1[j[3]] = 1;
                    tempCount += 1;
                  } else {
                    tempObject1[j[3]] += 1;
                  }
                }

                for (let j of i.pv2) {
                  if (tempObject2[j[3]] === undefined) {
                    tempObject2[j[3]] = 1;
                    tempCount += 1;
                  } else {
                    tempObject2[j[3]] += 1;
                  }
                }

                for (let j of i.pv3) {
                  if (tempObject3[j[3]] === undefined) {
                    tempObject3[j[3]] = 1;
                    tempCount += 1;
                  } else {
                    tempObject3[j[3]] += 1;
                  }
                }

                if (Object.keys(tempObject1).length === 0) {
                  i.pv1Object = {0: 0};
                  tempCount += 1;
                } else {
                  i.pv1Object = tempObject1;
                }

                if (Object.keys(tempObject2).length === 0) {
                  i.pv2Object = {0: 0};
                  tempCount += 1;
                } else {
                  i.pv2Object = tempObject2;
                }

                if (Object.keys(tempObject3).length === 0) {
                  i.pv3Object = {0: 0};
                  tempCount += 1;
                } else {
                  i.pv3Object = tempObject3;
                }

                i.pvCount = tempCount;
              }

              // 기상반 세팅
              for (let hardware of res) {
                if (hardware[0] === 2) {
                  resultObject.whether1Count++;
                }

                if (hardware[0] === 11) {
                  resultObject.whether2Count++;
                }

                if (hardware[0] === 10) {
                  resultObject.whether3Count++;
                }

                if (hardware[0] === 8) {
                  resultObject.whether4Count++;
                }

                if (hardware[0] === 9) {
                  resultObject.whether5Count++;
                }

                if (hardware[0] === 11) {
                  resultObject.whether6Count++;
                }

                if (hardware[0] === 6) {
                  resultObject.elecCount++;
                }
              }

              site.resultObject = resultObject;
            })
        }

        console.log('2. sites : ');
        console.log(this.sites);

      })
  }

  myTabSelectedIndexChange(index: number) {
    this.selectedSiteIndex = index;
    console.log(this.sites[index]);
  }
}

function sortFunction(a, b) {
  if (a[0] === b[0]) {
    return 0;
  }
  else {
    return (a[0] < b[0]) ? -1 : 1;
  }
}
