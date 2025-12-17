import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Hogar } from './hogar';

describe('Hogar', () => {
  let component: Hogar;
  let fixture: ComponentFixture<Hogar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Hogar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Hogar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
