export interface HistoricalDataModel {
  country: string;
  province: string;
  timeline: any;
  caseHistory: Array<string>;
  caseCount: Array<number>;
  growthAverage: number;
  predictedValue: number;
  casePrediction: Array<number>;
}
