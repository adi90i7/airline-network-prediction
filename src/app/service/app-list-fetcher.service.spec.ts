import { TestBed } from '@angular/core/testing';

import { AppListFetcherService } from './app-list-fetcher.service';

describe('AppListFetcherService', () => {
  let service: AppListFetcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppListFetcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
