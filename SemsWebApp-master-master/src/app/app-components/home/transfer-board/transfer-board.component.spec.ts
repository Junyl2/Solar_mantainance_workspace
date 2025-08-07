import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransferBoardComponent } from './transfer-board.component';

describe('TransferBoardComponent', () => {
  let component: TransferBoardComponent;
  let fixture: ComponentFixture<TransferBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransferBoardComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransferBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
