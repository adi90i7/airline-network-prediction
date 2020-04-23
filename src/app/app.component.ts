import {ChangeDetectorRef, Component, DoCheck, ElementRef, OnInit, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {Color, Label} from 'ng2-charts';
import {HistoricalDataService} from './service/historical-data.service';
import {HistoricalDataModel} from './historical-data.model';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {FormBuilder, FormGroup} from '@angular/forms';
import {debounceTime, finalize, map, switchMap, tap} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {AppService} from './app.service';
import {User} from './User';

export interface Airport {
  airport: string;
  city: string;
  country: string;
  airportCode: string;
}

export enum GrowthClassification {
  High = 1.5,
  Low = 0.9
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppComponent implements OnInit, DoCheck {

  hasLoggedIn: User;

  constructor(
    private appService: AppService) {

  }

  ngOnInit() {

  }

  ngDoCheck(): void {
    this.hasLoggedIn = this.appService.currentUserValue;
  }


}

