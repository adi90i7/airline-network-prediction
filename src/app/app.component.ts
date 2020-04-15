import {Component, OnInit, ViewChild} from '@angular/core';
import {ChartDataSets, ChartOptions} from 'chart.js';
import {Color, Label} from 'ng2-charts';
import {HistoricalDataService} from './service/historical-data.service';
import {HistoricalDataModel} from './historical-data.model';
import {MatTableDataSource} from '@angular/material/table';
import {MatPaginator} from '@angular/material/paginator';
import {MatSort} from '@angular/material/sort';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {FormControl} from '@angular/forms';
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';

export interface Airport {
  airport: string;
  city: string;
  country: string;
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
export class AppComponent implements OnInit {

  displayedColumns: string[] = ['country', 'province', 'predictedValueWeek', 'predictedValue', 'growthAverage', 'riskFactor'];
  dataSource: MatTableDataSource<HistoricalDataModel>;
  expandedElement: HistoricalDataModel | null;
  lineChartOptions: ChartOptions = {
    responsive: false
  };
  lineChartColors: Color[] = [
    {
      borderColor: 'black',
      backgroundColor: 'rgba(255,0,0,0.3)',
    },
  ];

  myControl = new FormControl();
  options: Airport[] = [
    {
      airport: 'Madang Airport, MAG',
      city: 'Madang',
      country: 'Papua New Guinea'
    }
  ];
  filteredOptions: Observable<Airport[]>;


  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private historicalDataService: HistoricalDataService) {
    const users = Array.from(createNewUser());

    this.dataSource = new MatTableDataSource(users);
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    // this.options = airportData;
    this.historicalDataService.fetchHistoricalData().subscribe((data: HistoricalDataModel[]) => {
      this.dataSource.data = data;
    });
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.airport),
        map(name => name ? this._filter(name) : this.options.slice())
      );
  }

  displayFn(user: Airport): string {

    this.dataSource.filter = user.country.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    return user && user.airport ? user.airport : '';
  }

  private _filter(name: string): Airport[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => option.airport.toLowerCase().indexOf(filterValue) === 0);
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getPrediction(data: HistoricalDataModel) {
    const cases: number[] = Object.values(data.timeline);
    return Math.round(cases[cases.length - 1] * Math.pow(data.growthAverage, 7));
  }
}

function createNewUser(): HistoricalDataModel[] {
  return [{
    country: 'Afghanistan',
    growthAverage: 2,
    casePrediction: [0, 0, 0, 0],
    predictedValue: 29,
    caseCount: [2, 3, 4, 5],
    caseHistory: ['12', '123', '123', '!23'],
    province: '',
    timeline: Math.round(Math.random() * 100).toString()
  }];
}

