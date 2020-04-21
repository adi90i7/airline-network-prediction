import {Schema} from 'mongoose';

const mongoose = require('mongoose');

const SeverityLevel: Schema = new Schema({
  high: Number,
  low: Number
});
export default mongoose.model('Severity', SeverityLevel);
