import BingHistoricalData from 'src/cronscheduler/historical-world-data';
import * as cron from 'cron';

const request = require('request');
const csv = require('csvtojson');

export async function runBingSchedulers() {
  await fetchAndStoreBingHistoricalData();
  const job = new cron.CronJob('00 00 00 * * *', async () => {
    await fetchAndStoreBingHistoricalData();
  });
  job.start();
}

async function fetchAndStoreBingHistoricalData() {
  const headers = Object.keys(BingHistoricalData.schema.paths)
    .filter(k => ['_id', '__v'].indexOf(k) === -1);

  let buffer = [];
  let counter = 0;



  csv()
    .fromStream(request.get('https://raw.githubusercontent.com/microsoft/Bing-COVID-19-Data/master/data/Bing-COVID19-Data.csv'))
    .subscribe(async (json) => {
      buffer.push(json);
      counter++;
      try {
        if ( counter > 10000 ) {
          console.log(buffer);
          await BingHistoricalData.insertMany(buffer);
          buffer = [];
          counter = 0;
        }
      } catch (e) {
        console.log(e);
      }
    }, (error) => {
      console.log(error);
    }, async () => {
      try {
        if ( counter > 0 ) {
          await BingHistoricalData.insertMany(buffer);
          buffer = [];
          counter = 0;
        }
      } catch (e) {
        console.log(e);
      }
      console.log('Bing Covid Data has been Updated');
    });
    /*.on('csv', async (csvRow) => {
      buffer.push(csvRow);
      counter++;
      if ( counter > 10000 ) {
        await BingHistoricalData.insertMany(buffer);
        buffer = [];
        counter = 0;
      }
    })
    .on('done', async (error) => {
      if ( counter > 0 ) {
        await BingHistoricalData.insertMany(buffer);
        buffer = [];
        counter = 0;
        console.log('Update Bing Data successfully!');
      }
    });*/
}
