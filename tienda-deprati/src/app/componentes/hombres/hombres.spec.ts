import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hombres } from './hombres';

describe('Hombres', () => {
  let component: Hombres;
  let fixture: ComponentFixture<Hombres>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hombres]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hombres);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
