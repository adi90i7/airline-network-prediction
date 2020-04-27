export interface HistoricalDataModel {
  country: string;
  province: string;
  timeline: any;
  caseHistory: Array<string>;
  caseCount: Array<number>;
  predictedValue7: number,
  predictedValue14: number,
  growthAverage: number;
  predictedValue: number;
  casePrediction: Array<number>;
  casePredictionPolynomial :Array<number>;
  sevLevel: string;
}
