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

export interface User {
  name: string;
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
  Math = Math;
  expandedElement: HistoricalDataModel | null;
  objectKeys = Object.keys;
  objectValues = Object.values;
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
  options: User[] = [
    {name: 'Mary'},
    {name: 'Shelley'},
    {name: 'Igor'}
  ];
  filteredOptions: Observable<User[]>;


  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  public countryFilter = new FormControl('');
  public provinceFilter = new FormControl('');

  public filterValues = {
    country: '',
    province: ''
  };

  constructor(private historicalDataService: HistoricalDataService) {
    const users = Array.from(createNewUser());

    this.dataSource = new MatTableDataSource(users);
    this.dataSource.filterPredicate = this.createFilter();

  }

  ngOnInit() {
    this.countryFilter.valueChanges
    .subscribe(
      country => {
        this.filterValues.country = country;
        this.dataSource.filter = JSON.stringify(this.filterValues);
      }
    );

    this.provinceFilter.valueChanges
    .subscribe(
      province => {
        this.filterValues.province = province;
        this.dataSource.filter = JSON.stringify(this.filterValues);
      }
    );

    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.historicalDataService.fetchHistoricalData().subscribe((data: HistoricalDataModel[]) => {
      this.dataSource.data = data;
    });
    this.filteredOptions = this.myControl.valueChanges
      .pipe(
        startWith(''),
        map(value => typeof value === 'string' ? value : value.name),
        map(name => name ? this._filter(name) : this.options.slice())
      );
  }

  displayFn(user: User): string {
    return user && user.name ? user.name : '';
  }

  private _filter(name: string): User[] {
    const filterValue = name.toLowerCase();

    return this.options.filter(option => option.name.toLowerCase().indexOf(filterValue) === 0);
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

  createFilter(): (data: any, filter: string) => boolean {
    let filterFunction = function(data, filter): boolean {
      let searchTerms = JSON.parse(filter);
      return (data.country || '').toLowerCase().indexOf(searchTerms.country) !== -1
      && (data.province || '').toString().toLowerCase().indexOf(searchTerms.province) !== -1;
    }
    return filterFunction;
  }

}

function createNewUser(): HistoricalDataModel[] {
  return [{
    country: 'Afghanistan',
    growthAverage: 2,
    growthTimeline: [2, 1, 1, 1],
    predictedValue: 29,
    province: '2',
    timeline: Math.round(Math.random() * 100).toString()
  }];
}

