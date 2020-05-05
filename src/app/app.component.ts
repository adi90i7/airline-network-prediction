import {Component, DoCheck, ElementRef, OnInit, ViewChild, AfterViewInit} from '@angular/core';

import {animate, state, style, transition, trigger} from '@angular/animations';

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
export class AppComponent implements AfterViewInit, DoCheck, OnInit {

  @ViewChild('appDrawer') appDrawer: ElementRef;

  hasLoggedIn: User;

  sideNavItems: NavItem[];
  isGenericTheme: boolean;

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

  ngDoCheck(): void {
    this.hasLoggedIn = this.appService.currentUserValue;
  }

}

