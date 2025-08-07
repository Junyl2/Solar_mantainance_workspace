import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerationQuantityComponent } from './generation-quantity.component';


describe('GenerationQuantityComponent', () => {
  let component: GenerationQuantityComponent;
  let fixture: ComponentFixture<GenerationQuantityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenerationQuantityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerationQuantityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
