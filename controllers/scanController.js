const fs = require('fs');
const path = require('path');
const db = require('../models/index');
const readline = require('readline');
const { once } = require('events');
const ftp = require('basic-ftp');
// const { processScans } = require('../utils/fileProcessors');
var csv = require('fast-csv');
const { includes } = require('lodash');
const log4js = require('log4js');

const MAXINPUT = 5000;

exports.getFilesFromFTP = async (req, res, next) => {
    const connectionOptions = {
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      // secure: false, 
    }
    
    let fileList = [];
    async function downloadFiles () {
      const client = new ftp.Client();
      client.ftp.verbose = true;
      try {
        await client.connect(connectionOptions.host);
        // await client.useTLS();
        await client.login(connectionOptions.user, connectionOptions.password);
        await client.useDefaultSettings();
        const files = await client.list('/IMBData/'); 
        await client.downloadToDir('uploads/scanData','/IMBData/');
        files.forEach( async file => { 
          fileList.push(file.name)
          await client.rename('/IMBData/' + file.name, '/downloaded/' + file.name) 
        });
        await client.close();
      }
      catch(err) {
        console.log(err);
      }
    }
    await downloadFiles();
    return fileList;
 }

exports.uploadScanData = async (req, res, next) => {
  console.log('starting uploadScans.....');
  const logger = log4js.getLogger("downloads");
  // set the download directory
  const scansFolder = path.join(__dirname, '../' + '/uploads/scanData/');
  console.log(scansFolder);
  // check for files in directory.
  let UploadsList = []
  const files = fs.readdir(scansFolder, async (err, files) => {
    console.table(files)
    const uploadedFiles = files.map(async (file, i) => {
        try {
          const rl = readline.createInterface({
            input: fs.createReadStream(scansFolder + file),
            crlfDelay: Infinity
          });  
          const filename = files[i];
          let fileRecords = 0;
          let = txtData = []  
          rl.on('line', async (line) => {
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
            txtData.push(newScan);
            fileRecords++;
            if (txtData.length > MAXINPUT) {
              // copy the original array of data for insertion
              const sqlData = [...txtData];
              txtData = [];
              await db.scan.bulkCreate(sqlData);
            }
          });
          await once(rl, 'close');
          // insert the leftover data
          await db.scan.bulkCreate(txtData);
          console.log(fileRecords, ' records from ', filename, ' processed.');
          UploadsList.push(filename);
        } catch (error) {
          console.log(error);
        }
      });
    });
    return UploadsList;
};

