import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TotalGenerationBoardComponent } from './total-generation-board.component';

describe('TotalGenerationBoardComponent', () => {
  let component: TotalGenerationBoardComponent;
  let fixture: ComponentFixture<TotalGenerationBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TotalGenerationBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TotalGenerationBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
