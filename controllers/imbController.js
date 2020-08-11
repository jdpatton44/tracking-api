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
      // send response
      await res.send({
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

exports.exportFileToDB = async (req, res) => {
  console.log('file: ', req.file);
  const filePath = path.join(__dirname, '../', req.file.path);
  console.log(req.body.jobId);
  console.log('attempting upload to db.');
  const csvData = [];

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
    
        rl.on('line', (line) => {
          console.log(`Line from file: ${line}`);
          const row = line.split(',');
          const newImb = {
            jobid: req.body.jobId,
            IMB: row[0].substring(1,row[0].length-1),
            zipPlusFour: row[1].substring(1,row[1].length-1),
            state: row[2].substring(1,row[2].length-1),
            package: row[3].substring(1,row[3].length-1),
          };
          csvData.push(newImb);
          if (csvData.length > 2000) {
            db.Imb.bulkCreate(csvData)
            .then(() => {
              console.log('successfully inserted data.');
              csvData.length = 0;
            })
            .catch(error => {
              console.log(error);
            });
            csvData.length = 0;
          }
        });
    
        await once(rl, 'close');
        db.Imb.bulkCreate(csvData)
            .then(() => {
              console.log('successfully inserted data.');
              csvData.length = 0;
            })
            .catch(error => {
              console.log(error);
            });
        console.log('File processed.');
      } catch (err) {
        console.error(err);
      }
    })();
  } catch (err) {
  console.error(err);
  }
}