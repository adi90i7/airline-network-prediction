import CovidCase from 'src/cronscheduler/historicalData';
import {CronJob} from 'cron';

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
    for (let i = 0; i < countryCases.length - 1; i++) {
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
      const growthAverage = growthTimeline.reduce((p, c) => p + c, 0) / growthTimeline.length;
      const casePrediction = Array(Object.keys(timeline).length - 1).fill(0);
      const caseCount = Object.values(timeline);
      casePrediction.push(caseCount[caseCount.length - 1]);
      for (let j = 0; j < 14; j++) {
        casePrediction.push(calculatePredictedGrowth(timeline, growthAverage, j + 1));
      }
      await CovidCase.findOneAndUpdate(historicalDataResult, {
        timeline,
        caseTimeline: calculateTimeline(Object.keys(timeline)),
        caseCount,
        growthAverage,
        casePrediction
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

function calculatePredictedGrowth(caseTimeline, growthAverage, days) {
  const cases: number[] = Object.values(caseTimeline);
  // return Math.log(cases[cases.length - 1]) + (Math.log(growthAverage) * days);
  return Math.round(cases[cases.length - 1] * Math.pow(growthAverage, days));
}

function appendTimeLine(apiTimeLine, dbTimeLine) {
  return {...apiTimeLine, ...dbTimeLine};
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


