const fs = require('fs');
const path = require('path');
const db = require('../models/index');
const readline = require('readline');
const { once } = require('events');
const ftp = require('basic-ftp');
// const { processScans } = require('../utils/fileProcessors');
var csv = require('fast-csv');
const { includes } = require('lodash');
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require('constants');
const { scan } = require('../models/index');
const log = require('log4js').getLogger("downloads");

const MAXINPUT = 5000;

exports.getFilesFromFTP = async (req, res, next) => {
    const connectionOptions = {
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASS,
      secure: true, 
    }
    
    let fileList = [];
    const client = new ftp.Client();
    client.ftp.verbose = true;
    // await client.useTLS();
    async function downloadFiles (client) {
      try {
        await client.connect(connectionOptions.host);
        await client.login(connectionOptions.user, connectionOptions.password);
        await client.useDefaultSettings();
        const files = await client.list('/IMBData/'); 
        const fileNames = await files.map(f => f.name)
        log.debug(`retrieving files: ${fileNames} from FTP`);
        await client.downloadToDir('uploads/scanData','/IMBData/');
        const filePromises =  files.map( async file => { 
          fileList.push(file.name)
          const downloadedFile = await client.rename('/IMBData/' + file.name, '/downloaded/' + file.name) 
          console.log('File List: ', fileList)
          return downloadedFile;
        });
        const downloadedFiles = await Promise.all(filePromises);
        console.log(downloadedFiles)
        
    }
      catch(error) {
        console.log(error);
      }
    }
    await downloadFiles(client);
    client.close();
    return fileList;
 }

exports.uploadScanData = async (req, res, next) => {
  console.log('starting uploadScans.....');
  // set the download directory
  const scansFolder = path.join(__dirname, '../' + '/scanData/');
  // check for files in directory.
  let totalfileRecords = 0;
  let fileRecords = [];
  let returnArr = [];
  await fs.readdir(scansFolder, async (error, files) => {
    if (error) {
      console.log(error) 
    } else {
      for (let i = 0; i < files.length; i++) {
        fileRecords[files[i]] = 0;
        try {
          const rl = readline.createInterface({
            input: fs.createReadStream(scansFolder + files[i]),
            crlfDelay: Infinity 
        });
        const filename = files[i];
        let = txtData = [];
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
          fileRecords[files[i]]++;
          if (txtData.length > MAXINPUT) {
            // copy the original array of data for insertion
            const sqlData = [...txtData];
            txtData = [];
            console.log('inserted ' + sqlData.length + ' records.');
            await db.scan.bulkCreate(sqlData);
          }
        });
  
        await once(rl, 'close');
        // insert the leftover data
        console.log('inserted ' + txtData.length + ' records.')
        returnArr[i] = (fileRecords[files[i]] + ' records from ' + filename + ' processed.')
        await db.scan.bulkCreate(txtData);
        txtData = []
        console.log(returnArr[i]);
        log.debug(returnArr[i]);
      }
      catch (error) {
        console.log(error);
      } 
    };    
    }
  });
  console.log('upload complete.')
  return returnArr; 
  };

  exports.joinScansAndImbs = async (req, res, next) => {
     const matches = await db.imb.findAll({
      include: [{
        model: scan,
        required: true,
      }]
    });
    return matches;
  }