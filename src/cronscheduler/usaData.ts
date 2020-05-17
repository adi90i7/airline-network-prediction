import { Schema } from 'mongoose';

const mongoose = require('mongoose');


const HistoricalDataSchema: Schema = new Schema({
  country: String,
  province: String,
  county: String,
  timeline: Object,
  caseTimeline: Array,
  caseCount: Array,
  lastCount: Number,
  predictedValue7: Number,
  predictedValue14: Number,
  growthTimeline: Array,
  growthAverage: Number,
  growthAverageTimeline: Array,
  casePrediction: Array,
  casePredictionPolynomial: Array
});
export default mongoose.model('USACase', HistoricalDataSchema);
