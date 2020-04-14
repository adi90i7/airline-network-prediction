export interface HistoricalDataModel {
  country: string;
  province: string;
  timeline: any;
  growthAverage: number;
  predictedValue: number;
  growthTimeline: Array<number>;
}
