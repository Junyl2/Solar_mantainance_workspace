import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GenerationBoardComponent } from './generation-board.component';

describe('GenerationBoardComponent', () => {
  let component: GenerationBoardComponent;
  let fixture: ComponentFixture<GenerationBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ GenerationBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GenerationBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
