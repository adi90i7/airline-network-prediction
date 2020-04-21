import 'zone.js/dist/zone-node';

import {ngExpressEngine} from '@nguniversal/express-engine';
import * as express from 'express';
import {join} from 'path';

import {AppServerModule} from './src/main.server';
import {APP_BASE_HREF} from '@angular/common';
import {existsSync} from 'fs';
import {runSchedulers} from './src/cronscheduler/schedulers';

import * as mongoose from 'mongoose';
import CovidCase from 'src/cronscheduler/historicalData';
import Severity from 'src/severity';
import {airportData} from './airports';
import {routes} from './routes';

const cors = require('cors');


// The Express app is exported so that it can be used by serverless Functions.
export function app() {
  const server = express();
  server.use(cors());
  const distFolder = join(process.cwd(), 'dist/network-predict/browser');
  const indexHtml = existsSync(join(distFolder, 'index.original.html')) ? 'index.original.html' : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
  server.engine('html', ngExpressEngine({
    bootstrap: AppServerModule,
  }));

  server.set('view engine', 'html');
  server.set('views', distFolder);

  server.get('/historicalData', (req, res) => {
    CovidCase.find({}, (err, users) => {
      res.send(users);
    });
  });

  server.get('/severity', (req, res) => {
    Severity.find({}, (err, users) => {
      res.send(users);
    });
  });
  // Serve static files from /browser
  server.get('*.*', express.static(distFolder, {
    maxAge: '1y'
  }));

  server.get('/airports', async (req, res) => {
    const userQuery = req.query.find;
    if (userQuery) {
      const filteredList = airportData.filter(x => x.airport.toLowerCase()
        .split(/\s+|\./).filter(word => word.startsWith(userQuery.toLowerCase())).length);
      res.send(filteredList);
    } else {
      res.send(airportData);
    }
  });

  server.get('/routes', async (req, res) => {
    const airportCode = req.query.airportCode;
    const airline = req.query.airline;
    let filteredRoutes = routes.filter(x => x.source.toLowerCase() === airportCode.toLowerCase());
    if (airline && airline !== 'undefined') {
      filteredRoutes = filteredRoutes.filter(x => x.airline.toLowerCase() === airline.toLowerCase());
    }
    const countries = airportData.filter(x => filteredRoutes.map(route => route.destination).includes(x.airportCode));
    res.send(countries);
  });

  server.get('/airlines', async (req, res) => {
    const userQuery = req.query.airportCode;
    const airlines = routes.filter(x => x.source.toLowerCase() === userQuery.toLowerCase()).map(route => route.airline);
    res.send([...new Set(airlines)]);
  });

  mongoose.connect('mongodb://adithya_c:airline1@ds163825.mlab.com:63825/heroku_bmkkf1qq', {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
    .then(() => console.log('Database connected successfully!'))
    .catch((err) => console.error(err));

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    res.render(indexHtml, {req, providers: [{provide: APP_BASE_HREF, useValue: req.baseUrl}]});
  });

  runSchedulers();
  return server;
}

function run() {
  const port = process.env.PORT || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
declare const __non_webpack_require__: NodeRequire;
const mainModule = __non_webpack_require__.main;
const moduleFilename = mainModule && mainModule.filename || '';
if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
  run();
}

export * from './src/main.server';
