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
  public loading = true;
  public errorMessage = '';
  public hardwareLoading = false;

  constructor(private semsService: SemsService) {}

  ngOnInit(): void {
    this.loading = true;
    this.errorMessage = '';
    this.loadSiteData();
  }

  private loadSiteData(): void {
    this.semsService.getSiteMapImage().subscribe({
      next: (res) => {
        console.log('Site map API response:', res);

        if (res && res.facility && res.facility.length > 0) {
          this.processSiteData(res.facility);
          this.loadHardwareData();
        } else {
          this.errorMessage = 'No facility data received from server';
          console.warn('No facility data in response:', res);
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading site map data:', error);
        this.errorMessage = 'Failed to load site map data';
        this.loading = false;
      },
    });
  }

  private processSiteData(facilities: any[]): void {
    const tempMap = new Map<string, any>();

    for (let facility of facilities) {
      // Normalize title by stripping suffix after '-'
      const baseTitle = facility.title
        ? facility.title.split('-')[0].trim()
        : 'Unknown';

      if (!tempMap.has(baseTitle)) {
        const newFacility = {
          ...facility,
          title: baseTitle,
          resultObject: null, // Initialize as null
        };
        tempMap.set(baseTitle, newFacility);
      }
    }

    this.sites = Array.from(tempMap.values());
    console.log('Processed sites:', this.sites);
  }

  private loadHardwareData(): void {
    if (this.sites.length === 0) {
      this.loading = false;
      return;
    }

    this.hardwareLoading = true;

    // Use Promise.all to handle all hardware count requests
    const hardwarePromises = this.sites.map((site) => {
      return new Promise<void>((resolve) => {
        if (!site.id) {
          console.warn(`Site ${site.title} has no ID, skipping hardware count`);
          site.resultObject = this.getDefaultResultObject();
          resolve();
          return;
        }

        this.semsService.getHardwareCount(site.id).subscribe({
          next: (res) => {
            console.log(`Hardware count response for site ${site.id}:`, res);
            site.resultObject = this.processHardwareData(res);
            resolve();
          },
          error: (error) => {
            console.error(
              `Error loading hardware count for site ${site.id}:`,
              error
            );
            site.resultObject = this.getDefaultResultObject();
            resolve();
          },
        });
      });
    });

    Promise.all(hardwarePromises).then(() => {
      console.log('All hardware data loaded:', this.sites);
      this.hardwareLoading = false;
      this.loading = false;
    });
  }

  private processHardwareData(hardwareData: any[]): any {
    if (!hardwareData || !Array.isArray(hardwareData)) {
      console.warn('Invalid hardware data received:', hardwareData);
      return this.getDefaultResultObject();
    }

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

    // Process inverters: hardware[0] === 0
    for (const hardware of hardwareData) {
      if (hardware && hardware[0] === 0 && hardware[4]) {
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

    // Process PV modules: hardware[0] === 5
    for (const hardware of hardwareData) {
      if (hardware && hardware[0] === 5 && hardware[1] && hardware[5]) {
        const invKey = hardware[5];
        if (invObject[invKey]) {
          if (hardware[1] === 1) {
            invObject[invKey].pv1.push(hardware);
          } else if (hardware[1] === 2) {
            invObject[invKey].pv2.push(hardware);
          } else if (hardware[1] === 3) {
            invObject[invKey].pv3.push(hardware);
          }
        }
      }
    }

    // Process temperature sensors: hardware[0] === 4
    for (const hardware of hardwareData) {
      if (hardware && hardware[0] === 4 && hardware[2] && hardware[5]) {
        const invKey = hardware[5];
        if (invObject[invKey] && invObject[invKey].tmp[hardware[2]]) {
          invObject[invKey].tmp[hardware[2]].push(hardware);
        }
      }
    }

    // Build invList
    for (const key in invObject) {
      resultObject.invList.push(invObject[key]);
    }

    // Process PV capacity groups
    for (const inv of resultObject.invList) {
      const tempObject1: any = {};
      const tempObject2: any = {};
      const tempObject3: any = {};
      let tempCount = 0;

      for (const j of inv.pv1) {
        if (j && j[3]) {
          tempObject1[j[3]] = (tempObject1[j[3]] || 0) + 1;
        }
      }
      for (const j of inv.pv2) {
        if (j && j[3]) {
          tempObject2[j[3]] = (tempObject2[j[3]] || 0) + 1;
        }
      }
      for (const j of inv.pv3) {
        if (j && j[3]) {
          tempObject3[j[3]] = (tempObject3[j[3]] || 0) + 1;
        }
      }

      inv.pv1Object = Object.keys(tempObject1).length ? tempObject1 : { 0: 0 };
      inv.pv2Object = Object.keys(tempObject2).length ? tempObject2 : { 0: 0 };
      inv.pv3Object = Object.keys(tempObject3).length ? tempObject3 : { 0: 0 };

      tempCount += Object.keys(inv.pv1Object).length;
      tempCount += Object.keys(inv.pv2Object).length;
      tempCount += Object.keys(inv.pv3Object).length;

      inv.pvCount = tempCount;
    }

    // Process weather station counts
    for (const hardware of hardwareData) {
      if (hardware && hardware[0]) {
        switch (hardware[0]) {
          case 2:
            resultObject.whether1Count++;
            break; // 일사량계
          case 11:
            resultObject.whether2Count++;
            break; // 풍향계
          case 10:
            resultObject.whether3Count++;
            break; // 풍속계
          case 8:
            resultObject.whether4Count++;
            break; // 온도계
          case 9:
            resultObject.whether5Count++;
            break; // 습도계
          case 11:
            resultObject.whether6Count++;
            break; // 강우량계
          case 6:
            resultObject.elecCount++;
            break; // 전력품질분석기
        }
      }
    }

    return resultObject;
  }

  private getDefaultResultObject(): any {
    return {
      invList: [],
      whether1Count: 0,
      whether2Count: 0,
      whether3Count: 0,
      whether4Count: 0,
      whether5Count: 0,
      whether6Count: 0,
      elecCount: 0,
    };
  }

  myTabSelectedIndexChange(index: number) {
    this.selectedSiteIndex = index;
    console.log(this.sites[index]);
  }

  onImageError(event: any, imageName: string): void {
    console.error(`Image failed to load: ${imageName}`, event);
    console.log(
      `Trying to load: assets/Images/sunlight-array/${imageName}.jpg or .png`
    );
    // Set fallback image
    event.target.src = 'assets/Images/ontest-logo.png';
  }

  onImageLoad(event: any, imageName: string): void {
    console.log(`Image loaded successfully: ${imageName}`);
  }
}

// kept for potential sorting needs
function sortFunction(a, b) {
  if (a[0] === b[0]) return 0;
  return a[0] < b[0] ? -1 : 1;
}
