import { Schema } from 'mongoose';

const mongoose = require('mongoose');


const HistoricalWorldDataSchema: Schema = new Schema({
  ID: Number,
  Updated: String,
  Confirmed: Number,
  ConfirmedChange: Number,
  Deaths: Number,
  DeathsChange: Number,
  Recovered: Number,
  RecoveredChange: Number,
  Latitude: Number,
  Longitude: Number,
  ISO2: String,
  ISO3: String,
  Country_Region: String,
  AdminRegion1: String,
  AdminRegion2: String
});
export default mongoose.model('BingHistoricalData', HistoricalWorldDataSchema);
