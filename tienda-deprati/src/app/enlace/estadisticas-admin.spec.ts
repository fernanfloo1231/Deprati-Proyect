import { TestBed } from '@angular/core/testing';

import { EstadisticasAdminService } from './estadisticas-admin';

describe('EstadisticasAdmin', () => {
  let service: EstadisticasAdminService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EstadisticasAdminService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
