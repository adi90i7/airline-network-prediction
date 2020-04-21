import {Component, OnInit, ViewChild} from '@angular/core';
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
export class AppComponent implements OnInit {

  displayedColumns: string[] = ['country', 'province', 'riskFactor'];
  GrowthClassification = GrowthClassification;
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

  filteredUsers: Airport[] = [];
  usersForm: FormGroup;
  isLoading = false;

  private initialDataSet: HistoricalDataModel[];

  @ViewChild(MatPaginator, {static: true}) paginator: MatPaginator;
  @ViewChild(MatSort, {static: true}) sort: MatSort;

  constructor(private historicalDataService: HistoricalDataService, private fb: FormBuilder) {
    const users = Array.from(createNewUser());

    this.dataSource = new MatTableDataSource(users);
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.historicalDataService.fetchHistoricalData().subscribe((data: HistoricalDataModel[]) => {
      this.dataSource.data = data;
      this.initialDataSet = data;
    });
    this.usersForm = this.fb.group({
      userInput: null,
    });

    this.usersForm
      .get('userInput')
      .valueChanges
      .pipe(
        debounceTime(300),
        tap(() => this.isLoading = true),
        switchMap(value => this.historicalDataService.fetchAirportList(value)
          .pipe(
            finalize(() => this.isLoading = false),
          )
        ),
        map((data: Airport[]) => data.slice(0, 5))
      )
      .subscribe(users => this.filteredUsers = users);
  }

  displayFn(user: Airport) {
    if (user) {
      return user.airport;
    }
  }

  selected(airport: Airport) {
    if (airport && airport.airportCode) {
      this.historicalDataService.fetchRoute(airport.airportCode).subscribe((data: Airport[]) => {
        const countriesOfAirport = data.map(x => x.country.toLowerCase());
        this.dataSource.data = this.initialDataSet.filter(x => countriesOfAirport.includes(x.country.toLowerCase()));
      });
    } else {
      this.dataSource.data = this.initialDataSet;
    }

  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}

function createNewUser(): HistoricalDataModel[] {
  return [{
    country: 'Afghanistan',
    growthAverage: 1,
    predictedValue7: 0,
    predictedValue14: 0,
    casePrediction: [0, 0, 0, 0],
    predictedValue: 0,
    caseCount: [0, 0, 0, 0],
    caseHistory: ['0', '0', '0', '0'],
    province: '',
    timeline: Math.round(Math.random() * 100).toString()
  }];
}

