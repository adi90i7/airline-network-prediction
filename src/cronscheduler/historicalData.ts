import {Schema} from 'mongoose';

const mongoose = require('mongoose');


const HistoricalDataSchema: Schema = new Schema({
  country: String,
  province: String,
  timeline: Map,
  predictedValue: Number,
  growthAverage: Number,
  growthTimeline: Array
});
export default mongoose.model('CovidCase', HistoricalDataSchema);
