import { Schema } from 'mongoose';

const mongoose = require('mongoose');


const HistoricalDataSchema: Schema = new Schema({
  country: String,
  province: String,
  timeline: Object,
  caseTimeline: Array,
  caseCount: Array,
  lastCount: Number,
  predictedValue7: Number,
  predictedValue14: Number,
  growthAverage: Number,
  casePrediction: Array,
  casePredictionPolynomial: Array
});
export default mongoose.model('CovidCase', HistoricalDataSchema);
