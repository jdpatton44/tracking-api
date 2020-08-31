const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
var log4js = require('log4js');
const fs = require('fs');
var path = require('path');
const db = require('./models');

// create express app
const app = express();

// enable CORS
app.use(cors());

// add other middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

log4js.configure({
    appenders: { downloads: { type: "file", filename: "downloads.log" } },
    categories: { default: { appenders: ["downloads"], level: "info" } }
});
const theAppLog = log4js.getLogger('downloads');

// use morgan for logging
// log only 4xx and 5xx responses to console
app.use(morgan('dev', {
    skip: function (req, res) { return res.statusCode < 400 }
}))

// log all requests to access.log
app.use(morgan('common', {
    stream: fs.createWriteStream(path.join(__dirname, 'access.log'), { flags: 'a' })
  }))

// import routes
const routes = require('./routes/index');
app.use('/', routes);

// import cron jobs
const cron = require('./utils/cronJobs')


// connect to db
db.sequelize.sync();

// start the app
const port = process.env.PORT || 3000;

app.listen(port, () => console.log(`App is listening on port ${port}.`));
