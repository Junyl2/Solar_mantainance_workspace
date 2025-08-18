import {
  Component,
  EventEmitter,
  OnInit,
  Output,
  ChangeDetectorRef,
} from '@angular/core';
import moment from 'moment';
import { SemsService } from 'src/app/services/sems-service';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sunlight-array-map',
  templateUrl: './sunlight-array-map.component.html',
  styleUrls: ['./sunlight-array-map.component.scss'],
})
export class SunlightArrayMapComponent implements OnInit {
  @Output() selectedIndexChange: EventEmitter<number> =
    new EventEmitter<number>();

  public sites: any[] = [];
  public selectedSiteIndex = 0;

  constructor(
    private semsService: SemsService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.semsService.getSiteMapImage().subscribe((res) => {
      console.log('API response:', res);

      if (res?.facility?.length) {
        const tempMap = new Map<string, any>();

        res.facility.forEach((facility) => {
          const baseTitle = facility.title.split('-')[0].trim();
          if (!tempMap.has(baseTitle)) {
            tempMap.set(baseTitle, {
              ...facility,
              title: baseTitle,
              imageUrl: `assets/site/${facility.filename}`,
            });
          }
        });

        this.sites = Array.from(tempMap.values());
      }

      console.log('Normalized sites:', this.sites);

      this.sites.forEach((site) => {
        this.semsService.getHardwareCount(site.id).subscribe((res) => {
          console.log(
            `Raw hardwareCount response for site ${site.title}:`,
            res
          );

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

          const invObject: Record<string, any> = {};

          // Initialize inverters
          res.forEach((hardware: any) => {
            if (hardware[0] === 0) {
              const inverterNumMatch = `${hardware[5]}`.match(/^\d+/);
              const inverterKey = inverterNumMatch
                ? inverterNumMatch[0]
                : hardware[5];
              const key = `inv-${inverterKey}`;
              if (!invObject[key]) {
                invObject[key] = {
                  inv: [],
                  pv1: [],
                  pv2: [],
                  pv3: [],
                  pv1Object: {},
                  pv2Object: {},
                  pv3Object: {},
                  pvCount: 0,
                  opt: [],
                  tmp: { 1: [], 2: [], 3: [], 4: [] },
                  displayName: inverterKey,
                };
              }
              invObject[key].inv.push(hardware);
            }
          });

          // Assign PVs, optimizers, temperature sensors
          res.forEach((hardware: any) => {
            const key = `inv-${hardware[5]}`;
            if (!invObject[key]) return; // skip unknown keys

            switch (hardware[0]) {
              case 5: // PV
                if (hardware[1] === 1) invObject[key].pv1.push(hardware);
                else if (hardware[1] === 2) invObject[key].pv2.push(hardware);
                else if (hardware[1] === 3) invObject[key].pv3.push(hardware);
                break;
              case 3: // Optimizer
                invObject[key].opt.push(hardware);
                break;
              case 4: // Temperature
                if (hardware[2] && invObject[key].tmp[hardware[2]]) {
                  invObject[key].tmp[hardware[2]].push(hardware);
                }
                break;
              case 2:
                resultObject.whether1Count++;
                break;
              case 11:
                resultObject.whether2Count++;
                resultObject.whether6Count++;
                break;
              case 10:
                resultObject.whether3Count++;
                break;
              case 8:
                resultObject.whether4Count++;
                break;
              case 9:
                resultObject.whether5Count++;
                break;
              case 6:
                resultObject.elecCount++;
                break;
            }
          });

          // Convert invObject to array
          resultObject.invList = Object.values(invObject);

          // Group PV counts
          resultObject.invList.forEach((inv: any) => {
            let tempCount = 0;
            ['pv1', 'pv2', 'pv3'].forEach((pvKey) => {
              const obj: any = {};
              inv[pvKey].forEach((item: any) => {
                obj[item[3]] = (obj[item[3]] || 0) + 1;
                tempCount++;
              });
              inv[`${pvKey}Object`] = Object.keys(obj).length ? obj : { 0: 0 };
              if (!Object.keys(obj).length) tempCount++; // ensure pvCount >=1
            });
            inv.pvCount = tempCount || 1;
          });

          // Ensure at least one dummy inverter if empty
          if (!resultObject.invList.length) {
            resultObject.invList.push({
              inv: [],
              pv1Object: { 0: 0 },
              pv2Object: { 0: 0 },
              pv3Object: { 0: 0 },
              pvCount: 1,
              opt: [],
              tmp: { 1: [], 2: [], 3: [], 4: [] },
            });
          }

          site.resultObject = resultObject;
          this.cd.detectChanges();

          console.log(
            `Normalized inverter data for site: ${site.title}`,
            resultObject.invList
          );
        });
      });

      console.log('2. sites:', this.sites);
    });
  }

  myTabSelectedIndexChange(index: number) {
    this.selectedSiteIndex = index;
    console.log(this.sites[index]);
  }
}
