import { Component, OnInit } from '@angular/core';
import { Moment } from 'moment';
import moment from 'moment';
import { SemsService } from '../services/sems-service';
import { Invertor } from '../models/invertor';
import { InvertorSelect } from '../models/invertor-select';
import { saveAs } from 'file-saver';
import { OntestUtils } from '../utils/ontest-utils';
import { Optimizers } from '../models/optimizers';
import { OptimizerSelect } from '../models/optimizer-select';

@Component({
  selector: 'app-download-invertor',
  templateUrl: './download-optimizer.component.html',
  styleUrls: ['./download-optimizer.component.scss'],
})
export class DownloadOptimizerComponent implements OnInit {
  startDailyDate: Date;
  endDailyDate: Date;
  startMinDailyDate: Date;
  startMaxDailyDate: Date;
  endMinDailyDate: Date;
  endMaxDailyDate: Date;

  public showProgressSpinner: boolean = false;

  invertors: Invertor[];
  optimizers: Optimizers[];
  facilities: { id: number; title: string; selected: boolean }[];
  optimizersFacilities: { id: number; title: string; selected: boolean }[];
  optimizerSelect: OptimizerSelect = new OptimizerSelect();
  private onTestUtil: OntestUtils = new OntestUtils(this.semsService);

  constructor(private semsService: SemsService) {}

  ngOnInit(): void {
    // Daily -------------------------
    this.startMinDailyDate = this.endMinDailyDate =
      this.semsService.getInstalledDate();
    this.startMaxDailyDate = this.endMaxDailyDate = moment().toDate();

    this.endDailyDate = moment().toDate();
    this.startDailyDate = moment().add(-1, 'M').toDate();
    // let ontestUtils = new OntestUtils();
    this.semsService.getSite().subscribe((siteRes) => {
      this.semsService.getOptimizerList().subscribe((res) => {
        this.optimizersFacilities = JSON.parse(
          JSON.stringify(this.onTestUtil.facilities)
        );
        for (let facility of this.optimizersFacilities) {
          facility.selected = true;
        }
        this.optimizers = res;
        for (let i = 0; i < this.optimizers.length; i++) {
          this.optimizers[i].selected = true;
        }
        console.log(this.optimizers);
      });
    });
  }

  // 입력 DC 선택
  toggleCheckbox($event: any, key: string) {
    (this.optimizerSelect as any)[key] = $event.checked;
  }

  toggleAllDC($event: any, isAll: boolean) {
    if (isAll) {
      this.optimizerSelect.dca = $event.checked;
      this.optimizerSelect.dcv = $event.checked;
    } else {
      this.optimizerSelect.dc =
        this.optimizerSelect.dca && this.optimizerSelect.dcv;
    }
  }

  toggleAllEtc($event: any) {
    let result =
      this.optimizerSelect.eday &&
      this.optimizerSelect.accumulatePower &&
      this.optimizerSelect.power &&
      this.optimizerSelect.tempPv &&
      this.optimizerSelect.tempExt &&
      this.optimizerSelect.status &&
      this.optimizerSelect.tempAmb;
    console.log(result);

    this.optimizerSelect.eday =
      this.optimizerSelect.accumulatePower =
      this.optimizerSelect.power =
      this.optimizerSelect.tempPv =
      this.optimizerSelect.tempExt =
      this.optimizerSelect.status =
      this.optimizerSelect.tempAmb =
      this.optimizerSelect.etc =
        !result;
  }

  checkAllEtc() {
    let result =
      this.optimizerSelect.eday &&
      this.optimizerSelect.accumulatePower &&
      this.optimizerSelect.power &&
      this.optimizerSelect.tempPv &&
      this.optimizerSelect.tempExt &&
      this.optimizerSelect.status &&
      this.optimizerSelect.tempAmb;

    this.optimizerSelect.etc = result;
  }

  download() {
    this.showProgressSpinner = true;

    this.semsService
      .downloadPvData(
        this.startDailyDate,
        this.endDailyDate,
        this.optimizers,
        this.optimizerSelect
      )
      .subscribe({
        next: (res: any) => {
          this.showProgressSpinner = false;
          // 타입 안전한 파일 저장
          this.saveFile(
            res,
            `pv-download-${moment(moment.now()).toISOString()}.xlsx`
          );
        },
        error: (error) => {
          this.showProgressSpinner = false;
          console.error('PV 데이터 다운로드 중 오류 발생:', error);
        },
      });
  }

  // 파일 저장을 위한 별도 메서드
  private saveFile(data: any, filename: string): void {
    try {
      // Case 1: 이미 Blob인 경우
      if (data instanceof Blob) {
        saveAs(data, filename);
        return;
      }

      // Case 2: ArrayBuffer인 경우
      if (data instanceof ArrayBuffer) {
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, filename);
        return;
      }

      // Case 3: Uint8Array인 경우

      if (data instanceof Uint8Array) {
        //@ts-ignore
        const blob = new Blob([data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        saveAs(blob, filename);
        return;
      }

      // Case 4: 문자열인 경우
      if (typeof data === 'string') {
        const blob = new Blob([data], {
          type: 'text/plain;charset=utf-8',
        });
        saveAs(blob, filename);
        return;
      }

      // Case 5: 배열이나 객체인 경우
      if (Array.isArray(data) || (typeof data === 'object' && data !== null)) {
        // Excel 형식이 필요한 경우 XLSX 라이브러리 사용
        if (filename.endsWith('.xlsx')) {
          this.saveAsExcel(data, filename);
        } else {
          // JSON 파일로 저장
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], {
            type: 'application/json;charset=utf-8',
          });
          const jsonFilename = filename.replace('.xlsx', '.json');
          saveAs(blob, jsonFilename);
        }
        return;
      }

      // Case 6: 기본값
      const dataString = String(data);
      const blob = new Blob([dataString], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, filename);
    } catch (error) {
      console.error('파일 저장 중 오류 발생:', error);

      // 최후의 수단: 간단한 fallback
      try {
        const fallbackData =
          typeof data === 'string' ? data : JSON.stringify(data);
        const fallbackBlob = new Blob([fallbackData], {
          type: 'application/octet-stream',
        });
        saveAs(fallbackBlob, filename);
      } catch (fallbackError) {
        console.error('Fallback 저장도 실패:', fallbackError);
      }
    }
  }

  // Excel 파일로 저장하는 메서드 (중복 제거)
  private saveAsExcel(data: any, filename: string): void {
    try {
      // XLSX 라이브러리를 동적으로 import
      import('xlsx')
        .then((XLSX) => {
          let worksheet: any;

          if (Array.isArray(data)) {
            // 배열 데이터를 워크시트로 변환
            worksheet = XLSX.utils.json_to_sheet(data);
          } else if (typeof data === 'object' && data !== null) {
            // 객체 데이터를 워크시트로 변환
            worksheet = XLSX.utils.json_to_sheet([data]);
          } else {
            // 기타 데이터
            worksheet = XLSX.utils.aoa_to_sheet([[String(data)]]);
          }

          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, 'PV Data');

          // Excel 파일로 저장
          const excelBuffer = XLSX.write(workbook, {
            bookType: 'xlsx',
            type: 'array',
          });

          const blob = new Blob([excelBuffer as BlobPart], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          saveAs(blob, filename);
        })
        .catch((error) => {
          console.error('XLSX 라이브러리 로드 실패:', error);
          // XLSX 로드 실패시 JSON으로 저장
          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], {
            type: 'application/json;charset=utf-8',
          });
          const jsonFilename = filename.replace('.xlsx', '.json');
          saveAs(blob, jsonFilename);
        });
    } catch (error) {
      console.error('Excel 저장 중 오류:', error);
      // Excel 저장 실패시 JSON으로 저장
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], {
        type: 'application/json;charset=utf-8',
      });
      const jsonFilename = filename.replace('.xlsx', '.json');
      saveAs(blob, jsonFilename);
    }
  }

  // Daily ----------------------------------------------------------
  onStartDailyDaySelected(normalizedDate: Moment) {
    this.startDailyDate = normalizedDate.toDate();
  }

  onEndDailyDaySelected(normalizedDate: Moment) {
    this.endDailyDate = normalizedDate.toDate();
  }

  selectOptimizer(insName: any, insNum: any) {
    console.log(this.invertors);
  }

  selectOptimizerFacility(facility: {
    id: number;
    title: string;
    selected: boolean;
  }) {
    console.log(facility);
    for (let optimizer of this.optimizers) {
      if (optimizer.facilityId == facility.id) {
        optimizer.selected = facility.selected;
      }
    }
  }
}
