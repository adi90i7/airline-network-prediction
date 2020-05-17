import CovidCase from 'src/cronscheduler/historicalData';
import USACase from 'src/cronscheduler/usaData';
import * as cron from 'cron';
import * as regression from 'regression';

const axios = require('axios').default;

const dateFormat = require('dateformat');

export async function runSchedulers() {
  await fetchAndStoreCovidHistoricalData();
  const job = new cron.CronJob('0 6,12,18 * * *',
    async function() {
      await fetchAndStoreCovidHistoricalData();
    },
    null,
    true,
    'America/Los_Angeles'
  );
  job.start();
}

const usaStates = ['american samoa', 'guam', 'northern mariana islands', 'puerto rico', 'virgin islands', 'alabama', 'alaska', 'arizona', 'arkansas', 'california', 'colorado', 'connecticut', 'delaware', 'district of columbia', 'florida', 'georgia', 'hawaii', 'idaho', 'illinois', 'indiana', 'iowa', 'kansas', 'kentucky', 'louisiana', 'maine', 'maryland', 'massachusetts', 'michigan', 'minnesota', 'mississippi', 'missouri', 'montana', 'nebraska', 'nevada', 'new hampshire', 'new jersey', 'new mexico', 'new york', 'north carolina', 'north dakota', 'ohio', 'oklahoma', 'oregon', 'pennsylvania', 'rhode island', 'south carolina', 'south dakota', 'tennessee', 'texas', 'utah', 'vermont', 'virginia', 'washington', 'west virginia', 'wisconsin', 'wyoming', 'diamond princess', 'grand princess'];

async function fetchAndStoreCovidHistoricalData() {
  await axios.get('https://corona.lmao.ninja/v2/historical?lastdays=60').then(async (response: any) => {
    const countryCases = response.data;
    await updateCountryCases(false, countryCases);
  });

  usaStates.map(async state => {
    await axios.get(`https://disease.sh/v2/historical/usacounties/${state}`).then(async (response: any) => {
      const countyCases = response.data;
      await updateCountryCases(true, countyCases.map(countyCase => {
        return {
          country: 'USA',
          ...countyCase
        };
      }));
    });
  });

}

async function updateCountryCases(isUSA, countryCases) {
  for (let i = 0; i < countryCases.length; i++) {
    const historicalDataResult = {
      country: countryCases[i].country,
      province: countryCases[i].province,
      county: countryCases[i].county,
    };

    const timeline = countryCases[i].timeline.cases;
    const initialCaseTimeline = Object.values(timeline);
    while (initialCaseTimeline[0] === 0) {
      initialCaseTimeline.shift();
    }
    const growthTimeline = calculateGrowthFactor(initialCaseTimeline);
    const growthAverageTimeline = calculateGrowthAverageTimeline(growthTimeline);
    const growthAverage = growthTimeline.length > 0 ? (growthTimeline.reduce((p, c) => p + c, 0) / growthTimeline.length) : 0;
    const casePredictionPolynomial = Array(Object.keys(timeline).length - 1).fill(0);
    const casePredictionExponential = Array(Object.keys(timeline).length - 1).fill(0);
    const caseCount = Object.values(timeline);
    const lastCount = caseCount[caseCount.length - 1];
    const predict = [];
    for (let j = 0; j < caseCount.length; j++) {
      predict.push([j + 1, caseCount[j]]);
    }
    casePredictionPolynomial.push(caseCount[caseCount.length - 1]);
    casePredictionExponential.push(caseCount[caseCount.length - 1]);
    for (let j = 0; j < 14; j++) {
      casePredictionPolynomial.push(calculatePredictedGrowthPolynomial(timeline, predict, growthAverage, j + 1));
      casePredictionExponential.push(calculatePredictedGrowthExponential(timeline, predict, growthAverage, j + 1));
    }

    if (isUSA) {
      await USACase.findOneAndUpdate(historicalDataResult, {
        timeline,
        caseTimeline: calculateTimeline(Object.keys(timeline)),
        caseCount,
        lastCount,
        growthTimeline,
        growthAverage,
        growthAverageTimeline,
        casePrediction: casePredictionExponential,
        casePredictionPolynomial
      }, {
        new: true,
        upsert: true
      });
    }
    else {
      await CovidCase.findOneAndUpdate(historicalDataResult, {
        timeline,
        caseTimeline: calculateTimeline(Object.keys(timeline)),
        caseCount,
        lastCount,
        growthTimeline,
        growthAverage,
        growthAverageTimeline,
        casePrediction: casePredictionExponential,
        casePredictionPolynomial
      }, {
        new: true,
        upsert: true
      });
    }
  }
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

function calculateGrowthAverageTimeline(growthTimeline) {
  const retValue = [];
  growthTimeline.reduce((accumulator, currentValue, currentIndex, array) => {
    const sum = accumulator + currentValue;
    const avg = sum / (currentIndex + 1);
    retValue.push(avg);
    return sum;
  }, 0);
  return retValue;
}

function calculatePredictedGrowthPolynomial(caseTimeline, predict, growthAverage, days) {
  const cases: number[] = Object.values(caseTimeline);
  const result = regression.polynomial(predict);
  const predictResult = result.predict(days + cases.length)[1];
  return predictResult > cases[cases.length - 1] ? Math.round(predictResult) : cases[cases.length - 1];
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


