import CovidCase from 'src/cronscheduler/historicalData';
import {NovelCovid} from 'novelcovid';
import {CronJob} from 'cron';


export async function runSchedulers() {
  await fetchAndStoreCovidHistoricalData();
  new CronJob('* * 6 * *', async () => {
    // await fetchAndStoreCovidHistoricalData();
  }, null, true).start();
}

async function fetchAndStoreCovidHistoricalData() {
  const track = new NovelCovid();
  await track.historical().then(async (res) => {
    for (let i = 0; i < res.length - 1; i++) {
      const historicalDataResult = {
        country: res[i].country,
        province: res[i].province
      };
      const growthTimeline = calculateGrowthFactor(res[i].timeline);
      const growthAverage = growthTimeline.reduce((p, c) => p + c, 0) / growthTimeline.length;
      const predictedValue = calculatePredictedGrowth((res[i].timeline), growthAverage);
      await CovidCase.findOneAndUpdate(historicalDataResult, {
        timeline: res[i].timeline.cases,
        growthAverage,
        predictedValue,
        growthTimeline
      }, {
        new: true,
        upsert: true
      });
    }

  });

}

function calculateGrowthFactor(caseTimeline) {
  const cases: number[] = Object.values(caseTimeline.cases);
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

function calculatePredictedGrowth(caseTimeline, growthAverage) {
  const cases: number[] = Object.values(caseTimeline.cases);
  return Math.round(cases[cases.length - 1] * Math.pow(growthAverage, 14));
}


