import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Valoraciones } from './valoraciones';

describe('Valoraciones', () => {
  let component: Valoraciones;
  let fixture: ComponentFixture<Valoraciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Valoraciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Valoraciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
