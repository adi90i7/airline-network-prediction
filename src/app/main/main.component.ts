import { ChangeDetectorRef, Component, DoCheck, OnInit, ViewChild } from '@angular/core';
import { ChartOptions } from 'chart.js';
import { Color} from 'ng2-charts';
import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormBuilder, FormGroup } from '@angular/forms';
import { debounceTime, finalize, map, switchMap, tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { User } from '../User';
import { HistoricalDataModel } from '../historical-data.model';
import { HistoricalDataService } from '../service/historical-data.service';
import { AppService } from '../app.service';
import { countryContinent } from './routes.filter';
import {ChartType} from 'angular-google-charts';

export interface Airport {
  airport: string;
  city: string;
  country: string;
  airportCode: string;
}
@Component({
  selector: 'app-root',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class MainComponent implements OnInit, DoCheck {

  hasLoggedIn: User;


  displayedColumns: string[] = ['country', 'province', 'sevLevel'];
  dataSource: MatTableDataSource<HistoricalDataModel>;
  expandedElement: HistoricalDataModel | null;
  lineChartOptions: ChartOptions = {
    responsive: true
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
  selectedAirport: string;
  airlines: Observable<string[]>;
  chips = [
    { name: 'High Traffic' },
    { name: 'Europe' },
    { name: 'Asia' },
    { name: 'North America' },
    { name: 'South America' },
    { name: 'Africa' },
    { name: 'Oceania' }
  ];
  private initialDataSet: HistoricalDataModel[];
  private updatedDataSet: HistoricalDataModel[];
  private selectedChips: any[] = [];

  public myData = [
    ['Country', 'Popularity'],
    ['Germany', 200],
    ['United States', 300],
    ['Brazil', 400],
    ['Canada', 500],
    ['France', 600],
    ['RU', 700]
  ];

  public mapOptions = {
    colorAxis: {colors: ['green', 'orange', 'red']}
  };


  public apiKey = 'AIzaSyDx5sVwRM7EG4QB4QmWpyA8jB0mIoCd99Q';

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  public geoChart: ChartType = ChartType.GeoChart;


  constructor(private historicalDataService: HistoricalDataService, private fb: FormBuilder, private cd: ChangeDetectorRef,
              private appService: AppService) {
    const users = Array.from(createNewUser());

    this.dataSource = new MatTableDataSource(users);
  }

  ngOnInit() {
    this.dataSource.paginator = this.paginator;
    this.historicalDataService.fetchHistoricalData().subscribe(async (data: HistoricalDataModel[]) => {
      const caseSeverity = await this.historicalDataService.getSeverityLevel().toPromise();
      const transformedData = data.map((x) => {
        return {
          ...x, ...caseSeverity[0],
          sevLevel: x.growthAverage > caseSeverity[0].high ? 'High' : (x.growthAverage < caseSeverity[0].low ? 'Low' : 'Medium')
        };
      });
      transformedData.sort((a, b) => {
        const severity = {
          Low: 1,
          Medium: 2,
          High: 3
        };
        return severity[a.sevLevel] - severity[b.sevLevel];
      });
      this.dataSource.data = transformedData;
      this.initialDataSet = transformedData;
      this.updatedDataSet = transformedData;
      this.setMapData(transformedData);
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


  selectChip(event: any, chip: any) {
    const index = this.selectedChips.indexOf(chip);
    if (index >= 0) {
      this.selectedChips.splice(index, 1);
    } else {
      this.selectedChips.push(chip);
    }

    const countriesInContinent = [];
    this.selectedChips.forEach(element => {
      countriesInContinent.push(
        ...countryContinent.filter(x => x.continent.toLowerCase() === element.name.toLowerCase()).map(x => x.country.toLowerCase())
      );
    });
    if (this.selectedChips.length > 0) {
      this.dataSource.data = this.updatedDataSet.filter(x => countriesInContinent.includes(x.country.toLowerCase()));
      this.setMapData(this.dataSource.data);
    } else {
      this.dataSource.data = this.updatedDataSet;
      this.setMapData(this.dataSource.data);
    }
  }

  sortData(sort: Sort) {
    const data = this.dataSource.data.slice();
    if (!sort.active || sort.direction === '') {
      this.dataSource.data = data;
      return;
    }

    this.dataSource.data = data.sort((a, b) => {
      const isAsc = sort.direction === 'asc';
      switch (sort.active) {
        case 'country': return this.compare(a.country, b.country, isAsc);
        case 'province': return this.compare(a.province, b.province, isAsc);
        case 'sevLevel': return this.compareSeverityLevel(a.sevLevel, b.sevLevel, isAsc);
        default: return 0;
      }
    });
  }
  compare(a: number | string, b: number | string, isAsc: boolean) {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  compareSeverityLevel(a: number | string, b: number | string, isAsc: boolean) {
    const severity = {
      Low: 1,
      Medium: 2,
      High: 3
    };
    return (severity[a] <= severity[b] ? -1 : 1) * (isAsc ? 1 : -1);
  }

  ngDoCheck(): void {
    this.hasLoggedIn = this.appService.currentUserValue;
  }


  displayFn(user: Airport) {
    if (user) {
      return user.airport;
    }
  }

  selected(airport: Airport) {
    if (airport && airport.airportCode) {
      this.historicalDataService.fetchRoute(airport.airportCode).subscribe((data: Airport[]) => {
        const countriesOfAirport = data.map(countryOfAirport => countryOfAirport.country.toLowerCase());
        const countryCodesOfAirport = data.map(countryCodeOfAirport => countryCodeOfAirport.airportCode.toLowerCase());
        console.log(countryCodesOfAirport);
        const transformedData = this.initialDataSet.filter(historicalData => {
          return countriesOfAirport.includes(historicalData.country.toLowerCase());
        }).map(historicalData => {
          return {
            ...historicalData,
            airportCodes: historicalData.airportCodes.filter(airportCode => countryCodesOfAirport.includes(airportCode.toLowerCase()))
          };
        });
        console.log(transformedData);
        this.dataSource.data = transformedData;
        this.setMapData(transformedData);
        this.cd.detectChanges();
      });
      this.selectedAirport = airport.airportCode;
      this.airlines = this.historicalDataService.getAirlinesRoutes(airport.airportCode);
    } else {
      this.dataSource.data = this.initialDataSet;
    }
  }

  setMapData(transformedData) {
    const countryData = {};
    transformedData.map(txData => {
      if (txData.country === 'USA') {
        txData.country = 'United States';
      }
      if (txData.country === 'UK') {
        txData.country = 'United Kingdom';
      }
      if (( undefined === countryData[txData.country])) {
        countryData[txData.country] = txData.sevLevel === 'Medium' ? 2 : (txData.sevLevel === 'High' ? 3 : 1);
      }
      else {
        //countryData[txData.country] += txData.lastCount;
      }
    });
    const mapData = [];
    for (const [key, value] of Object.entries(countryData)) {
      const returnData = [];
      returnData.push(key);
      returnData.push(value);
      mapData.push(returnData);
    }
    this.myData = mapData;
  }

  updateCountryList($event) {
    const airlineCode = $event.value;
    this.historicalDataService.fetchRoute(this.selectedAirport, airlineCode).subscribe((data: Airport[]) => {
      const countriesOfAirport = data.map(x => x.country.toLowerCase());
      const countryCodesOfAirport = data.map(countryCodeOfAirport => countryCodeOfAirport.airportCode.toLowerCase());
      this.dataSource.data = this.initialDataSet.filter(historicalData => {
        return countriesOfAirport.includes(historicalData.country.toLowerCase());
      }).map(historicalData => {
        return {
          ...historicalData,
          airportCodes: historicalData.airportCodes.filter(airportCode => countryCodesOfAirport.includes(airportCode.toLowerCase()))
        };
      });
      this.setMapData(this.dataSource.data);
      this.updatedDataSet = this.dataSource.data;
      this.cd.detectChanges();
    });
  }

  resetOriginalState() {
    this.usersForm.get('userInput').reset();
    this.selectedAirport = null;
    this.dataSource.data = this.initialDataSet;
    this.setMapData(this.initialDataSet);
    this.cd.detectChanges();
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
    casePredictionPolynomial: [0, 0, 0, 0],
    predictedValue: 0,
    caseCount: [0, 0, 0, 0],
    caseHistory: ['0', '0', '0', '0'],
    province: '',
    timeline: Math.round(Math.random() * 100).toString(),
    sevLevel: 'Low',
    airportCodes: ['AAA', 'AAB']
  }];
}

