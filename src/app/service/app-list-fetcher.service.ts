import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {NavItem} from './nav-item';
import {map} from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppListFetcherService {

  constructor(private httpClient: HttpClient) {}

  fetchAppList(): Observable<NavItem[]> {
    return this.httpClient.get('/appList').pipe(
      map((res: any) => res.applications)
    );
  }
}
