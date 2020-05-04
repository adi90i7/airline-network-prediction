import {ChangeDetectorRef, Component, DoCheck, ElementRef, OnInit, ViewChild, AfterViewInit, OnDestroy} from '@angular/core';
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
import { NavService } from './service/nav.service';
import { NavItem } from './service/nav-item';
import navigationItems from '../assets/data/navigation-items.json';
import { ActivatedRoute } from '@angular/router';

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
  styleUrls: ['./app.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class AppComponent implements AfterViewInit, DoCheck, OnInit, OnDestroy {

  @ViewChild('appDrawer') appDrawer: ElementRef;

  hasLoggedIn: User;

  sideNavItems: NavItem[];
  isGenericTheme: boolean;
  mobileQuery: MediaQueryList;
  private _mobileQueryListener: () => void;

  constructor(
    private appService: AppService,
    private navService: NavService,
    private route: ActivatedRoute) {

  }

  ngAfterViewInit() {
    this.navService.appDrawer = this.appDrawer;
  }

  ngOnInit() {
    this.sideNavItems = navigationItems.applications;
    this.route.queryParams
      .subscribe(params => {
        console.log(params);
        this.isGenericTheme = !params.airline || params.airline.toUpperCase() !== 'KL';
        console.log(this.isGenericTheme);
      });
  }

  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  ngDoCheck(): void {
    this.hasLoggedIn = this.appService.currentUserValue;
  }


}

