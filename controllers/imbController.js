const fs = require('fs');
const csv = require('csv');
const path = require('path');
const Imb = require('../models/imb.model');
const db = require('../models/index');

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
    const byteSize = 10;
    let data = [];
    const stream = fs
      .createReadStream(filePath, { highWaterMark: 1 * 1024 })
      .pipe(csv.parse({ delimiter: ',', from_line: 2 }));

    stream.on('readable', () => {
      let chunk;
      while ((chunk = stream.read(byteSize))) {
        // create a new imb record for the table from the row
        const newImb = {
          jobid: req.body.jobId,
          IMB: chunk[0],
          zipPlusFour: chunk[1],
          state: chunk[2],
          package: chunk[3],
        };
        data.push(newImb);
        if (data.length > 1500) {
          db.Imb.bulkCreate(data)
            .then(() => {
              console.log('success.');
              data = [];
            })
            .catch(error => {
              console.log(error);
            });
        }
      }
    });
    stream.on('end', () => {
      db.Imb.bulkCreate(data)
        .then(() => {
          console.log('success.');
        })
        .catch(error => {
          console.log(error);
        });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}`,
    });
  }
};
