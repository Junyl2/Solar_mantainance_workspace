import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TempHumiComponent } from './temp-humi.component';

describe('TempHumiComponent', () => {
  let component: TempHumiComponent;
  let fixture: ComponentFixture<TempHumiComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TempHumiComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TempHumiComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
