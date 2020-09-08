const fs = require('fs');
const path = require('path');
const db = require('../models/index');
const readline = require('readline');
const { once } = require('events');
const { includes } = require('lodash');
//const { processScans } = require('../utils/fileProcessors');
const log = require('log4js').getLogger("downloads");

const MAXINPUT = 5000;

exports.uploadFile = async (req, res, next) => {
  console.log(req.body.jobId);
  try {
    const { file } = req;
    // make sure file is available
    if (!file) {
      res.status(400).send({
        status: false,
        data: 'No file is selected.',
      });
    } else {
      // send response if file was uploaded
      await res.status(200).send({
        status: true,
        message: 'File is uploaded.',
        data: {
          name: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
        },
      });
      // log file name
      log.debug(`Uploaded ${file.originalname} to server.`);
      next();
    }
  } catch (err) {
    res.status(500).send(err);
  }  
};

exports.exportTrackingFileToDB = async (req, res, next) => {
  // get the file's location
  const filePath = path.join(__dirname, '../', req.file.path);
  console.log('attempting upload to db.');
  
  try {
    if (req.file == undefined) {
      return res.status(400).send('No file found.');
    }
    (async function processLineByLine() {
      try {
        const rl = readline.createInterface({
          input: fs.createReadStream(filePath),
          crlfDelay: Infinity
        });
        let numLines = 0;
        let csvData = [];
        rl.on('line', async (line) => {
          // read a line of the data and split it into an array to create an object to insert into the db
          const row = line.split(',');
          if(row[0].includes('barcode')) return; 
          const newImb = {
            jobid: req.body.jobId,
            // use substring to get rid of quotes around the data
            IMB: row[0].substring(1,row[0].length-1),
            zipPlusFour: row[1].substring(1,row[1].length-1),
            state: row[2].substring(1,row[2].length-1),
            package: row[3].substring(1,row[3].length-1),
          };
          // add the object to the array to be inserted
          csvData.push(newImb);
          numLines ++;
          if (csvData.length > MAXINPUT) {
            // copy the original array of data for insertion
            const sqlData = [...csvData];
            csvData = [];
            await db.imb.bulkCreate(sqlData)
            console.log(`successfully  inserted ${MAXINPUT} rows into the database.`);
            csvData.length = [];
          }
        });
        // close the file
        await once(rl, 'close');
        // insert the leftover data
        await db.imb.bulkCreate(csvData)
        console.log('successfully inserted the last bit of data.');
        csvData = [];
        console.log('File processed.');
        log.debug(`Uploaded ${numLines} records from ${req.file.originalname} into database`)
      } catch (error) {
        console.error(error);
      }
    })();
  } catch (error) {
  console.error(error);
  }
};

exports.deleteUpload = async (req, res) => {
  fs.unlink(req.file, function (err) {
    if (err) throw err;
    // if no error, file has been deleted successfully
    console.log('File deleted!');
});  
  res.send("File is deleted.");
};
