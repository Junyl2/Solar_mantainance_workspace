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
    // Clear cache when processing new data
    this.pvTypesCache.clear();
    this.totalsCache.clear();

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

  calculateSolarCapacity(capacity: any, quantity: any): string {
    const cap = Number(capacity) || 0;
    const qty = Number(quantity) || 0;
    if (!cap || !qty) return '0.000';
    const totalWatts = cap * qty;
    const totalKilowatts = totalWatts / 1000;
    return totalKilowatts.toFixed(3);
  }

  getTotalQuantity(data: any): number {
    let total = 0;

    // Sum all PV quantities
    for (const item of Object.values(data.pv1Object || {})) {
      total += Number(item) || 0;
    }
    for (const item of Object.values(data.pv2Object || {})) {
      total += Number(item) || 0;
    }
    for (const item of Object.values(data.pv3Object || {})) {
      total += Number(item) || 0;
    }

    return total;
  }

  getTotalSolarCapacity(data: any): string {
    let totalWatts = 0;

    // Calculate total watts for all PV modules
    for (const [capacity, quantity] of Object.entries(data.pv1Object || {})) {
      totalWatts += (Number(capacity) || 0) * (Number(quantity) || 0);
    }
    for (const [capacity, quantity] of Object.entries(data.pv2Object || {})) {
      totalWatts += (Number(capacity) || 0) * (Number(quantity) || 0);
    }
    for (const [capacity, quantity] of Object.entries(data.pv3Object || {})) {
      totalWatts += (Number(capacity) || 0) * (Number(quantity) || 0);
    }

    const totalKilowatts = totalWatts / 1000;
    return totalKilowatts.toFixed(3);
  }

  // Cache for building PV types to prevent repeated calculations
  private pvTypesCache = new Map<string, any[]>();

  // Get building-specific PV data with hardcoded first column labels
  getBuildingPVTypes(facility: any): any[] {
    if (!facility?.title) return [];

    const buildingKey = facility.title.replace('동', '');

    // Check cache first
    if (this.pvTypesCache.has(buildingKey)) {
      return this.pvTypesCache.get(buildingKey)!;
    }

    const pvTypes: any[] = [];

    // Hardcode the first column labels based on building requirements
    const buildingPVStructure: any = {
      '201': [
        { type: 'Dark Blue', pvKey: 'pv3' },
        { type: 'Dark Gray', pvKey: 'pv1' },
      ],
      '202': [
        { type: 'Dark Blue', pvKey: 'pv3' },
        { type: 'Dark Gray', pvKey: 'pv1' },
      ],
      '203': [{ type: 'Dark Gray', pvKey: 'pv1' }],
      '204': [
        { type: 'Terra Cotta', pvKey: 'pv2' },
        { type: 'Dark Gray', pvKey: 'pv1' },
      ],
      '205': [
        { type: 'Terra Cotta', pvKey: 'pv2' },
        { type: 'Dark Gray', pvKey: 'pv1' },
      ],
      '206': [{ type: 'Dark Gray', pvKey: 'pv1' }],
    };

    const structure = buildingPVStructure[buildingKey] || [];

    if (!facility?.resultObject?.invList) {
      // If no API data, return structure with default values
      const defaultData = structure.map((item) => ({
        type: item.type,
        capacity: '0',
        quantity: '0',
        solarCapacity: '0.000',
      }));
      this.pvTypesCache.set(buildingKey, defaultData);
      return defaultData;
    }

    // Process API data and map to the required structure
    for (const pvItem of structure) {
      let foundData = false;

      for (const data of facility.resultObject.invList) {
        const pvObject = data[pvItem.pvKey + 'Object'];
        if (pvObject && Object.keys(pvObject).length > 0) {
          for (const [capacity, quantity] of Object.entries(pvObject)) {
            if (Number(quantity) > 0) {
              pvTypes.push({
                type: pvItem.type,
                capacity: capacity,
                quantity: quantity,
                solarCapacity: this.calculateSolarCapacity(capacity, quantity),
              });
              foundData = true;
              break; // Take first non-zero entry
            }
          }
        }
        if (foundData) break;
      }

      // If no API data found for this PV type, add with default values
      if (!foundData) {
        pvTypes.push({
          type: pvItem.type,
          capacity: '0',
          quantity: '0',
          solarCapacity: '0.000',
        });
      }
    }

    // Cache the result
    this.pvTypesCache.set(buildingKey, pvTypes);
    return pvTypes;
  }

  // Cache for facility totals
  private totalsCache = new Map<
    string,
    { quantity: number; capacity: string }
  >();

  // Calculate total quantity from API data only
  getFacilityTotalQuantity(facility: any): number {
    if (!facility?.title) return 0;

    const buildingKey = facility.title.replace('동', '');
    const cacheKey = `${buildingKey}_totals`;

    if (this.totalsCache.has(cacheKey)) {
      return this.totalsCache.get(cacheKey)!.quantity;
    }

    if (!facility?.resultObject?.invList) {
      this.totalsCache.set(cacheKey, { quantity: 0, capacity: '0.000' });
      return 0;
    }

    let total = 0;
    for (const data of facility.resultObject.invList) {
      // Sum all PV quantities from API data
      for (const item of Object.values(data.pv1Object || {})) {
        total += Number(item) || 0;
      }
      for (const item of Object.values(data.pv2Object || {})) {
        total += Number(item) || 0;
      }
      for (const item of Object.values(data.pv3Object || {})) {
        total += Number(item) || 0;
      }
    }

    // Cache the result
    const existing = this.totalsCache.get(cacheKey) || {
      quantity: 0,
      capacity: '0.000',
    };
    this.totalsCache.set(cacheKey, { ...existing, quantity: total });

    return total;
  }

  getFacilityTotalSolarCapacity(facility: any): string {
    if (!facility?.title) return '0.000';

    const buildingKey = facility.title.replace('동', '');
    const cacheKey = `${buildingKey}_totals`;

    if (this.totalsCache.has(cacheKey)) {
      return this.totalsCache.get(cacheKey)!.capacity;
    }

    if (!facility?.resultObject?.invList) {
      this.totalsCache.set(cacheKey, { quantity: 0, capacity: '0.000' });
      return '0.000';
    }

    let totalWatts = 0;
    for (const data of facility.resultObject.invList) {
      // Calculate total watts for all PV modules from API data
      for (const [capacity, quantity] of Object.entries(data.pv1Object || {})) {
        totalWatts += (Number(capacity) || 0) * (Number(quantity) || 0);
      }
      for (const [capacity, quantity] of Object.entries(data.pv2Object || {})) {
        totalWatts += (Number(capacity) || 0) * (Number(quantity) || 0);
      }
      for (const [capacity, quantity] of Object.entries(data.pv3Object || {})) {
        totalWatts += (Number(capacity) || 0) * (Number(quantity) || 0);
      }
    }

    const totalKilowatts = totalWatts / 1000;
    const capacityStr = totalKilowatts.toFixed(3);

    // Cache the result
    const existing = this.totalsCache.get(cacheKey) || {
      quantity: 0,
      capacity: '0.000',
    };
    this.totalsCache.set(cacheKey, { ...existing, capacity: capacityStr });

    return capacityStr;
  }

  // Get the correct total label for each building
  getTotalLabel(facility: any): string {
    const buildingKey = facility.title.replace('동', '');
    return buildingKey === '201' ? '종합계' : '총합계';
  }

  hasFacilityEquipment(facility: any): boolean {
    const buildingKey = facility.title.replace('동', '');
    // Only buildings 202 and 205 have equipment based on your requirements
    return ['202', '205'].includes(buildingKey);
  }

  getFacilityEquipment(facility: any): string {
    const buildingKey = facility.title.replace('동', '');

    if (!facility?.resultObject) {
      return buildingKey === '202' ? '데이터 없음' : '데이터 없음';
    }

    const resultObject = facility.resultObject;
    const equipment: string[] = [];

    // Weather equipment from API
    if (resultObject.whether1Count > 0) {
      equipment.push(`일사량계 ${resultObject.whether1Count}개`);
    }
    if (resultObject.whether2Count > 0) {
      equipment.push(`풍향계 ${resultObject.whether2Count}개`);
    }
    if (resultObject.whether3Count > 0) {
      equipment.push(`풍속계 ${resultObject.whether3Count}개`);
    }
    if (resultObject.whether4Count > 0) {
      equipment.push(`온도계 ${resultObject.whether4Count}개`);
    }
    if (resultObject.whether5Count > 0) {
      equipment.push(`습도계 ${resultObject.whether5Count}개`);
    }
    if (resultObject.whether6Count > 0) {
      equipment.push(`강우량계 ${resultObject.whether6Count}개`);
    }
    if (resultObject.elecCount > 0) {
      equipment.push(`전력품질분석기 ${resultObject.elecCount}개`);
    }

    // Temperature sensors from API
    const tempSensors = this.getTemperatureSensors(facility);
    if (tempSensors) {
      equipment.push(tempSensors);
    }

    // If no equipment data found, return Korean fallback message
    if (equipment.length === 0) {
      return '데이터 없음';
    }

    return equipment.join(', ');
  }

  private hasTemperatureSensors(facility: any): boolean {
    if (!facility?.resultObject?.invList) return false;

    for (const data of facility.resultObject.invList) {
      if (data.tmp && (data.tmp[2]?.length > 0 || data.tmp[4]?.length > 0)) {
        return true;
      }
    }
    return false;
  }

  private getTemperatureSensors(facility: any): string {
    if (!facility?.resultObject?.invList) return '';

    let rearCount = 0;
    let airCount = 0;

    for (const data of facility.resultObject.invList) {
      if (data.tmp) {
        rearCount += data.tmp[2]?.length || 0; // 모듈 후면
        airCount += data.tmp[4]?.length || 0; // 공기층
      }
    }

    const sensors: string[] = [];
    if (rearCount > 0) {
      sensors.push(`온도센서 모듈후면 ${rearCount}개`);
    }
    if (airCount > 0) {
      sensors.push(`공기층 ${airCount}개`);
    }

    return sensors.join('/');
  }
}

// kept for potential sorting needs
function sortFunction(a, b) {
  if (a[0] === b[0]) return 0;
  return a[0] < b[0] ? -1 : 1;
}
