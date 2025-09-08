import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import moment from 'moment';
import { SemsService } from 'src/app/services/sems-service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sunlight-array-map',
  templateUrl: './sunlight-array-map.component.html',
  styleUrls: ['./sunlight-array-map.component.scss'],
})
export class SunlightArrayMapComponent implements OnInit {
  @Output() selectedIndexChange: EventEmitter<number>;

  public sites: any[] = [];
  public selectedSiteIndex = 0;

  constructor(private semsService: SemsService) {}

  ngOnInit(): void {
    this.semsService.getSiteMapImage().subscribe((res) => {
      console.log('API response:', res);

      if (res && res.facility.length > 0) {
        const tempMap = new Map<string, any>();

        for (let facility of res.facility) {
          // Normalize title by stripping suffix after '-'
          const baseTitle = facility.title.split('-')[0].trim();

          if (!tempMap.has(baseTitle)) {
            const newFacility = { ...facility };
            newFacility.title = baseTitle;
            newFacility.imageUrl = `assets/site/${facility.filename}`;
            tempMap.set(baseTitle, newFacility);
          }
        }

        this.sites = Array.from(tempMap.values());
      }

      console.log('Normalized sites:', this.sites);

      // Fetch hardware count per site
      for (let i = 0; i < this.sites.length; i++) {
        const site = this.sites[i];

        this.semsService.getHardwareCount(site.id).subscribe((res) => {
          console.log(`Raw hardwareCount response for site ${site.id}:`, res);

          const resultObject: any = {
            invList: [],
            whether1Count: 0,
            whether2Count: 0,
            whether3Count: 0,
            whether4Count: 0,
            whether5Count: 0,
            whether6Count: 0,
            elecCount: 0,
          };

          const invObject: any = {};

          // Inverters: hardware[0] === 0
          // tmp: 1 Front, 2 Rear, 3 Building, 4 Air (we will only keep 2 & 4 in UI)
          // pv 1: Dark Gray, 2: Terra Cotta, 3: Dark Blue (renamed from White Gray)
          for (const hardware of res) {
            if (hardware[0] === 0) {
              invObject[hardware[4]] = {
                inv: [],
                pv1: [],
                pv2: [],
                pv3: [],
                pv1Object: {},
                pv2Object: {},
                pv3Object: {},
                pvCount: 0,
                tmp: { 1: [], 2: [], 3: [], 4: [] },
              };
              invObject[hardware[4]].inv.push(hardware);
            }
          }

          // PV by capacity
          for (const hardware of res) {
            if (
              hardware[0] === 5 &&
              hardware[1] !== null &&
              hardware[1] !== 0
            ) {
              if (hardware[1] === 1 && invObject[hardware[5]] !== undefined) {
                invObject[hardware[5]].pv1.push(hardware);
              } else if (
                hardware[1] === 2 &&
                invObject[hardware[5]] !== undefined
              ) {
                invObject[hardware[5]].pv2.push(hardware);
              } else if (
                hardware[1] === 3 &&
                invObject[hardware[5]] !== undefined
              ) {
                invObject[hardware[5]].pv3.push(hardware);
              }
            }
          }

          // Temperature sensors: keep counts but later UI shows only 2 & 4
          for (const hardware of res) {
            if (hardware[0] === 4 && hardware[2] !== 0) {
              const invKey = hardware[5];
              if (invObject[invKey]) {
                // still collect all; UI will show only indices 2 and 4
                invObject[invKey].tmp[hardware[2]].push(hardware);
              }
            }
          }

          // Build invList
          for (const key in invObject) {
            resultObject.invList.push(invObject[key]);
          }

          // PV capacity group-by counts per color
          for (const inv of resultObject.invList) {
            const tempObject1: any = {};
            const tempObject2: any = {};
            const tempObject3: any = {};
            let tempCount = 0;

            for (const j of inv.pv1) {
              tempObject1[j[3]] = (tempObject1[j[3]] || 0) + 1;
            }
            for (const j of inv.pv2) {
              tempObject2[j[3]] = (tempObject2[j[3]] || 0) + 1;
            }
            for (const j of inv.pv3) {
              tempObject3[j[3]] = (tempObject3[j[3]] || 0) + 1;
            }

            // count how many PV rows will render (ensure at least one per PV bucket)
            inv.pv1Object = Object.keys(tempObject1).length
              ? tempObject1
              : { 0: 0 };
            inv.pv2Object = Object.keys(tempObject2).length
              ? tempObject2
              : { 0: 0 };
            inv.pv3Object = Object.keys(tempObject3).length
              ? tempObject3
              : { 0: 0 };

            tempCount += Object.keys(inv.pv1Object).length;
            tempCount += Object.keys(inv.pv2Object).length;
            tempCount += Object.keys(inv.pv3Object).length;

            inv.pvCount = tempCount; // used in HTML rowspans
          }

          // Weather station counts (kept as-is)
          for (const hardware of res) {
            if (hardware[0] === 2) resultObject.whether1Count++; // 일사량계
            if (hardware[0] === 11) resultObject.whether2Count++; // 풍향계 (note: 11 also used below as-is)
            if (hardware[0] === 10) resultObject.whether3Count++; // 풍속계
            if (hardware[0] === 8) resultObject.whether4Count++; // 온도계
            if (hardware[0] === 9) resultObject.whether5Count++; // 습도계
            if (hardware[0] === 11) resultObject.whether6Count++; // 강우량계 (original mapping kept)
            if (hardware[0] === 6) resultObject.elecCount++; // 전력품질분석기
          }

          site.resultObject = resultObject;
        });
      }

      console.log('2. sites : ', this.sites);
    });
  }

  myTabSelectedIndexChange(index: number) {
    this.selectedSiteIndex = index;
    console.log(this.sites[index]);
  }
}

// kept for potential sorting needs
function sortFunction(a, b) {
  if (a[0] === b[0]) return 0;
  return a[0] < b[0] ? -1 : 1;
}
