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
  console.log(filePath);

  console.log('attempting upload to db.');
  try {
    if (req.file == undefined) {
      return res.status(400).send('No file found.');
    }

    const stream = fs.createReadStream(filePath);
    const parser = csv.parse({
      delimiter: ',',
      columns: true,
    });

    stream.on('data', function(data) {
      const row = data.toString();
      console.log(row);
      console.log('----');
    });
    // const transform = await csv.transform(row => {
    //   const resultObj = {
    //     jobId: req.body.jobId,
    //     IMB: row[0],
    //     zipPlusFour: row[1],
    //     state: row[2],
    //     package: row[3],
    //   };
    //   console.log(resultObj);
    //   Imb.create(resultObj)
    //     .then(() => {
    //       console.log('record created.');
    //     })
    //     .catch(error => {
    //       console.log('Error: ', error);
    //     });
    //   input.pipe(parser).pipe(transform);
    // });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}`,
    });
  }
};
