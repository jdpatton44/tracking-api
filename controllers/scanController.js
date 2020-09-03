const fs = require('fs');
const path = require('path');
const db = require('../models/index');
const readline = require('readline');
const { once } = require('events');
const ftp = require('basic-ftp');
// const { processScans } = require('../utils/fileProcessors');
var csv = require('fast-csv');
const { includes } = require('lodash');
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
        await files.forEach( async file => { 
          fileList.push(file.name)
          await client.rename('/IMBData/' + file.name, '/downloaded/' + file.name) 
          console.log('File List: ', fileList)
        });  
    }
      catch(error) {
        console.log(error);
      }
    }
    await downloadFiles(client);
    // client.close();
    
    return fileList;
 }

exports.uploadScanData = async (req, res, next) => {
  console.log('starting uploadScans.....');
  // set the download directory
  const scansFolder = path.join(__dirname, '../' + '/uploads/scanData/');
  console.log(scansFolder);
  // check for files in directory.
  let UploadsList = []
  let totalfileRecords = 0;
  let fileRecords = [];
  const files = fs.readdir(scansFolder, async (err, files) => {
    console.table(files);
    const uploadedFiles = await Promise.all(files.map(async (file, i) => {
      fileRecords[file] = 0;
      try {
        const rl = readline.createInterface({
          input: fs.createReadStream(scansFolder + file),
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
          fileRecords[file]++;
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
        console.log(fileRecords[file], ' records from ', filename, ' processed.');
        log.debug(fileRecords[file], ' records from ', filename, ' processed to database.');
        return filename;
      }
      catch (error) {
        console.log(error);
      }
      fs.unlink(file)
    }));
  });
    return UploadsList;
};

