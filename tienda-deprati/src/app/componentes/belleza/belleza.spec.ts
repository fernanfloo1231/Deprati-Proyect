import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Belleza } from './belleza';

describe('Belleza', () => {
  let component: Belleza;
  let fixture: ComponentFixture<Belleza>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Belleza]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Belleza);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
