import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadInvertorComponent } from './download-invertor.component';

describe('DownloadInvertorComponent', () => {
  let component: DownloadInvertorComponent;
  let fixture: ComponentFixture<DownloadInvertorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ DownloadInvertorComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadInvertorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
