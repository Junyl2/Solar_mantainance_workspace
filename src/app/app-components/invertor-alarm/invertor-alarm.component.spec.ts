import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InvertorAlarmComponent } from './invertor-alarm.component';

describe('InvertorAlarmComponent', () => {
  let component: InvertorAlarmComponent;
  let fixture: ComponentFixture<InvertorAlarmComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InvertorAlarmComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InvertorAlarmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
