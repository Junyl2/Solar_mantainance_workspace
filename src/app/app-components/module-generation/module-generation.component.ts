import { Component, OnInit, SimpleChanges, AfterViewInit, ViewChild, ElementRef, AfterContentChecked, ChangeDetectorRef  } from '@angular/core';
import {SemsService} from "../../services/sems-service";
@Component({
  selector: 'app-module-generation',
  templateUrl: './module-generation.component.html',
  styleUrls: ['./module-generation.component.scss']
})
export class ModuleGenerationComponent implements OnInit, AfterViewInit, AfterContentChecked {
  constructor(private semsService: SemsService) {}

  public resultList: any[] = [];

  ngOnInit(): void {
    this.semsService.getModuleGenerationPvInfo().subscribe(async res => {
      let tempObject = {};
      console.log(res);

      for (let i of res) {
        if (i[2] === 0) {
          if (tempObject[i[4]] === undefined) {
            tempObject[i[4]] = {1: [], 2: [], 3: []};
          }
        }
      }

      for (let i of res) {
        if (i[2] === 3) {
          if (tempObject[i[5]] !== undefined) {
            if (i[3] === 1 || i[3] === 2 || i[3] === 3) {
              tempObject[i[5]][i[3]].push(i);
            }
          }
        }
      }

      console.log(tempObject);

      for (let i in tempObject) {
        this.semsService.getModuleGenerationInvInfo(Number(i)).subscribe(res => {
          let resultObject = {inv: [], pv: {1: [], 2: [], 3: []}, opt: {1: {}, 2: {}, 3: {}}, img: ''};

          if (res.length !== 0) {
            resultObject.inv.push(res[0]);
            resultObject.pv = tempObject[Number(i)];

            for (let j in tempObject[Number(i)]) {
              for (let k of tempObject[Number(i)][j]) {
                this.semsService.getModuleGenerationOptInfo(k[4]).subscribe(res => {
                    if (res.length !== 0) {
                      resultObject.opt[k[3]][k[4]] = res[0];
                    }
                })
              }
            }

            this.resultList.push(resultObject);
            console.log(this.resultList);
          }
        })

        await new Promise(f => setTimeout(f, 300));
      }
    })
  }

  ngAfterContentChecked(): void {
  }

  ngAfterViewInit(): void {
  }

  imageShow(filename: string) {
    let imgBox: any = document.getElementsByClassName('img_box')[0];
    imgBox.style.display = 'flex';
    // @ts-ignore
    document.getElementById('img_box_main_img').src = 'assets/site/' + filename;
  }

  imageClose() {
    let imgBox: any = document.getElementsByClassName('img_box')[0];
    imgBox.style.display = 'none';
  }

}
