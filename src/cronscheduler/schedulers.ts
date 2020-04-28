import CovidCase from 'src/cronscheduler/historicalData';
import { CronJob } from 'cron';
import * as regression from 'regression';

const axios = require('axios').default;

const dateFormat = require('dateformat');

export async function runSchedulers() {
  await fetchAndStoreCovidHistoricalData();
  new CronJob('1 * * * *', async () => {
    console.log('cron is triggerd');
    // await fetchAndStoreCovidHistoricalData();
  }, null, true).start();
}

async function fetchAndStoreCovidHistoricalData() {
  await axios.get('https://corona.lmao.ninja/v2/historical?lastdays=60').then(async (response: any) => {
    const countryCases = response.data;
    for (let i = 0; i < countryCases.length; i++) {
      const historicalDataResult = {
        country: countryCases[i].country,
        province: countryCases[i].province
      };

      const timeline = countryCases[i].timeline.cases;
      const initialCaseTimeline = Object.values(timeline);
      while (initialCaseTimeline[0] === 0) {
        initialCaseTimeline.shift();
      }
      const growthTimeline = calculateGrowthFactor(initialCaseTimeline);
      const growthAverage = growthTimeline.length > 0 ? (growthTimeline.reduce((p, c) => p + c, 0) / growthTimeline.length) : 0;
      const casePredictionPolynomial = Array(Object.keys(timeline).length - 1).fill(0);
      const casePredictionExponential = Array(Object.keys(timeline).length - 1).fill(0);
      const caseCount = Object.values(timeline);
      const predict = []
      for (let i = 0; i < caseCount.length; i++) {
        predict.push([i + 1, caseCount[i]])
      }
      casePredictionPolynomial.push(caseCount[caseCount.length - 1]);
      casePredictionExponential.push(caseCount[caseCount.length - 1]);
      for (let j = 0; j < 14; j++) {
        casePredictionPolynomial.push(calculatePredictedGrowthPolynomial(timeline, predict, growthAverage, j + 1));
        casePredictionExponential.push(calculatePredictedGrowthExponential(timeline, predict, growthAverage, j + 1));
      }
      await CovidCase.findOneAndUpdate(historicalDataResult, {
        timeline,
        caseTimeline: calculateTimeline(Object.keys(timeline)),
        caseCount,
        growthAverage,
        casePrediction: casePredictionExponential,
        casePredictionPolynomial
      }, {
        new: true,
        upsert: true
      });
    }
  });

}

function calculateGrowthFactor(caseTimeline) {
  const cases: number[] = Object.values(caseTimeline);
  const growth = [];
  for (let i = 0; i < cases.length - 1; i++) {
    if (cases[i] === 0) {
      growth.push(0);
    } else {
      growth.push(cases[i + 1] / cases[i]);
    }
  }
  return growth;
}

function calculatePredictedGrowthPolynomial(caseTimeline, predict, growthAverage, days) {
  const cases: number[] = Object.values(caseTimeline);
  const result = regression.polynomial(predict);
  const predictResult = result.predict(days + cases.length)[1];
  return predictResult > cases[cases.length - 1] ? predictResult : cases[cases.length - 1];
}

function calculatePredictedGrowthExponential(caseTimeline, predict, growthAverage, days) {
  const cases: number[] = Object.values(caseTimeline);
  return Math.round(cases[cases.length - 1] * Math.pow(growthAverage, days));
}

function appendTimeLine(apiTimeLine, dbTimeLine) {
  return { ...apiTimeLine, ...dbTimeLine };
}

function calculateTimeline(caseTime) {
  const timeline: Array<string> = caseTime;
  for (let i = 1; i < 15; i++) {
    const someDate = new Date();
    someDate.setDate(someDate.getDate() + i);
    timeline.push(dateFormat(someDate, 'shortDate'));
  }
  return timeline;
}


