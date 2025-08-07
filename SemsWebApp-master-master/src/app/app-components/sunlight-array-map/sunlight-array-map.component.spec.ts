import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SunlightArrayMapComponent } from './sunlight-array-map.component';

describe('SunlightArrayMapComponent', () => {
  let component: SunlightArrayMapComponent;
  let fixture: ComponentFixture<SunlightArrayMapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SunlightArrayMapComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SunlightArrayMapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
