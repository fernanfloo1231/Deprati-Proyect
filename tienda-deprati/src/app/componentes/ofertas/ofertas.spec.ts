import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ofertas } from './ofertas';

describe('Ofertas', () => {
  let component: Ofertas;
  let fixture: ComponentFixture<Ofertas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ofertas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Ofertas);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
