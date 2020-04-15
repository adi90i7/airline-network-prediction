import CovidCase from 'src/cronscheduler/historicalData';
import {Historical, NovelCovid} from 'novelcovid';
import {CronJob} from 'cron';

const dateFormat = require('dateformat');

export async function runSchedulers() {
  await fetchAndStoreCovidHistoricalData();
  new CronJob('1 * * * *', async () => {
    console.log('cron is triggerd');
    // await fetchAndStoreCovidHistoricalData();
  }, null, true).start();
}

async function fetchAndStoreCovidHistoricalData() {
  const track = new NovelCovid();

  async function performGrowthCalculation(res: Historical[], i: number,
                                         searchedCase, historicalDataResult: { country: string; province: string }) {
    const updatedTimeline = appendTimeLine(res[i].timeline.cases, searchedCase.timeline);
    const growthTimeline = calculateGrowthFactor(updatedTimeline);
    const growthAverage = growthTimeline.reduce((p, c) => p + c, 0) / growthTimeline.length;
    const caseTimeline = calculateTimeline(Object.keys(updatedTimeline));
    const predictedValue7 = calculatePredictedGrowth(updatedTimeline, growthAverage, 7);
    const predictedValue14 = calculatePredictedGrowth(updatedTimeline, growthAverage, 14);
    searchedCase.casePrediction = Array(Object.keys(searchedCase.timeline).length).fill(0);
    for (let j = 0; j < 14; j++) {
      searchedCase.casePrediction.push(calculatePredictedGrowth(updatedTimeline, growthAverage, j + 1));
    }
    console.log(searchedCase.country);
    await CovidCase.findOneAndUpdate(historicalDataResult, {
      timeline: updatedTimeline,
      caseTimeline,
      caseCount: Object.values(updatedTimeline),
      growthAverage,
      predictedValue7,
      predictedValue14,
      casePrediction: searchedCase.casePrediction
    }, {
      new: true,
      upsert: true
    });
  }

  await track.historical().then(async (res: Historical[]) => {
    for (let i = 0; i < res.length - 1; i++) {
      const historicalDataResult = {
        country: res[i].country,
        province: res[i].province
      };
      const searchedCase = await CovidCase.findOne(historicalDataResult);
      if (searchedCase && searchedCase.country) {
        await performGrowthCalculation(res, i, searchedCase, historicalDataResult);
      } else {
        await CovidCase.findOneAndUpdate(historicalDataResult, {
          timeline: res[i].timeline.cases,
          caseTimeline: [],
          caseCount: [],
          growthAverage: 1.0,
          predictedValue7: 123,
          predictedValue14: 12,
          casePrediction: []
        }, {
          new: true,
          upsert: true
        });
        const findCase = await CovidCase.findOne(historicalDataResult);
        await performGrowthCalculation(res, i, findCase, historicalDataResult);
      }
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


