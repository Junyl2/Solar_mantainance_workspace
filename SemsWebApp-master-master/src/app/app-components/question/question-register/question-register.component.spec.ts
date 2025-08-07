import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionRegisterComponent } from './question-register.component';

describe('QuestionRegisterComponent', () => {
  let component: QuestionRegisterComponent;
  let fixture: ComponentFixture<QuestionRegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionRegisterComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuestionRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
