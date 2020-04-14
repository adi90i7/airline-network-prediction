import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable()
export class HistoricalDataService {
  constructor(private httpClient: HttpClient) {
  }

  fetchHistoricalData() {
    return this.httpClient.get('/historicalData');
  }
}
