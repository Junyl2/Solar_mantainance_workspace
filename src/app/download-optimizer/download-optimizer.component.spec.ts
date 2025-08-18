import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DownloadOptimizerComponent } from './download-optimizer.component';

describe('DownloadInvertorComponent', () => {
  let component: DownloadOptimizerComponent;
  let fixture: ComponentFixture<DownloadOptimizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [DownloadOptimizerComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DownloadOptimizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
