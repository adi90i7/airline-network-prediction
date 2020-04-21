import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Airport} from '../app.component';
import {Observable} from 'rxjs';

@Injectable()
export class HistoricalDataService {
  constructor(private httpClient: HttpClient) {
  }

  fetchHistoricalData() {
    return this.httpClient.get('/historicalData');
  }

  fetchAirportList(queryString: string): Observable<Airport[]> {
    return this.httpClient.get<Airport[]>(`/airports?find=${queryString}`);
  }

  fetchRoute(queryString: string) {
    return this.httpClient.get(`/routes?airportCode=${queryString}`);
  }

  getSeverityLevel() {
    return this.httpClient.get('/severity');
  }
}
