const fs = require('fs');
const csv = require('csv');
const path = require('path');
const Imb = require('../models/imb.model');
const db = require('../models/index');
const readline = require('readline');
const { once } = require('events');

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
      next();
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.exportTrackingFileToDB = async (req, res) => {
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
        let csvData = [];
        rl.on('line', (line) => {
          // read a line of the data and split it into an array to create an object to insert into the db
          const row = line.split(',');
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
          if (csvData.length > 5000) {
            // copy the original array of data for insertion
            const sqlData = [...csvData];
            csvData = [];
            db.Imb.bulkCreate(sqlData)
            .then(() => {
              console.log('successfully inserted data.');
            })
            .catch(error => {
              console.log(error);
            });
            csvData.length = 0;
          }
        });
        // close the file
        await once(rl, 'close');
        // insert the leftover data
        db.Imb.bulkCreate(csvData)
            .then(() => {
              console.log('successfully inserted the last bit of data.');
              csvData = [];
            })
            .catch(error => {
              console.log(error);
            });
        console.log('File processed.');
      } catch (error) {
        console.error(error);
      }
    })();
  } catch (error) {
  console.error(error);
  }
}