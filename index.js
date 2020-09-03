const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
var log4js = require('log4js');
const fs = require('fs');
var path = require('path');
const db = require('./models');

// create express app
const app = express();

// enable CORS
app.use(cors());

// add bodyParser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// add log4js
log4js.configure({
    appenders: { downloads: { type: "file", filename: "log\\downloads.log" } },
    categories: { default: { appenders: ["downloads"], level: "debug" } }
  });
const logger = log4js.getLogger("downloads");

/// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        log.error("Something went wrong:", err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    log.error("Something went wrong:", err);
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

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
