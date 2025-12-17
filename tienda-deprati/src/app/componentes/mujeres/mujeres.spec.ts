import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Mujeres } from './mujeres';

describe('Mujeres', () => {
  let component: Mujeres;
  let fixture: ComponentFixture<Mujeres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Mujeres]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Mujeres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
