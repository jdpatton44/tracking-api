const fs = require('fs');
const path = require('path');
const db = require('../models/index');
const readline = require('readline');
const { once } = require('events');
const ftp = require('basic-ftp');
const { processScans } = require('../utils/fileProcessors');
var csv = require('fast-csv');
const { includes } = require('lodash');

exports.getFilesFromFTP = async (req, res, next) => {
    const connectionOptions = {
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      // secure: false, 
    }

    async function downloadFiles () {
      const client = new ftp.Client();
      client.ftp.verbose = true;
      try {
        await client.connect(connectionOptions.host);
        // await client.useTLS();
        await client.login(connectionOptions.user, connectionOptions.password);
        await client.useDefaultSettings();
        const files = await client.list('/IMBData/'); 
        const fileNames = files.map(f => f.name);
        await client.downloadToDir('uploads/scanData','/IMBData/');

        // res.send(fileNames)
        
      }
      catch(err) {
        console.log(err);
      }
      client.close();
    }
   const fileList = downloadFiles();
 }

 exports.uploadScanData = async (req, res, next) => {
  console.log('starting uploadScans.....')
  const scansFolder = path.join(__dirname, '../' + '/uploads/scanData/');
  console.log(scansFolder);
  // check for files in directory.
  fs.readdir(scansFolder, (err, files) => {
    if(files ) {
      files.forEach(file => {
        console.log(file)
        try {
          const rl = readline.createInterface({
            input: fs.createReadStream(scansFolder + file),
            crlfDelay: Infinity
          });  
          let = txtData = []  
          rl.on('line', (line) => {
            // read a line of the data and split it into an array to create an object to insert into the db
            const row = line.split(',');
            const newScan = {
              // use substring to get rid of quotes around the data
              Imb: row[0],
              scanDateTime: row[2],
              scanZip: row[4],
              phase: row[5],
              expectedDel: row[6],
              anticipatedDel: row[7],
            };
            // add the object to the array to be inserted
            //console.log(newScan)
            txtData.push(newScan);
            if (txtData.length > 2500) {
              // copy the original array of data for insertion
              const sqlData = [...txtData];
              txtData = [];
              db.scan.bulkCreate(sqlData)
              .then(() => {
                console.log('successfully inserted data.');
              })
              .catch(error => {
                console.log(error);
              });
              txtData.length = [];
            }
            res.send('all files uploaded.')
          }); 
        } catch (error) {
          console.log(error);
        }
      })    
    }
  })
};

