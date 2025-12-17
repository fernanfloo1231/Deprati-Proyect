import { TestBed } from '@angular/core/testing';

import { RastreoService } from './rastreo.service';

describe('RastreoService', () => {
  let service: RastreoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RastreoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
