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
    
    const client = new ftp.Client();
    client.ftp.verbose = true;
    // await client.useTLS();
    client.trackProgress(info => {
      console.log("File", info.name)
      console.log("Type", info.type)
      console.log("Transferred", info.bytes)
      console.log("Transferred Overall", info.bytesOverall)
  })
    async function downloadFiles (client) {
      try {
        await client.connect(connectionOptions.host);
        await client.login(connectionOptions.user, connectionOptions.password);
        await client.useDefaultSettings();
        const files = await client.list('/IMBData/'); 
        const fileNames = await files.map(f => f.name)
        log.debug(`retrieving files: ${fileNames} from FTP`);
        client.trackProgress(info => console.log(info.name, ": ", info.bytesOverall))
        await client.downloadToDir('scanData','/IMBData/');
        for (let i = 0; i < files.length; i++) {
          await client.rename('/IMBData/' + files[i].name, '/downloaded/' + files[i].name) 
        }
        client.trackProgress();
        return fileNames;
    }
      catch(error) {
        console.log(error);
      }
    }
    const fileList = await downloadFiles(client);
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
          const mailPhase = row[5] ? row[5].substr(6,2) : '';
          const newScan = {
            // use substring to get rid of quotes around the data
            IMB: row[0],
            scanDateTime: row[2],
            scanZip: row[4],
            mailPhase,
            expectedDel: row[6],
            anticipatedDel: row[7],
          };
          // add the object to the array to be inserted if it is a valid IMB
          if(newScan.IMB.length > 30) {
            txtData.push(newScan);
            fileRecords[files[i]]++;
          }
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
        await db.scan.bulkCreate(txtData);
        console.log('inserted ' + txtData.length + ' records.')
        returnArr[i] = (fileRecords[files[i]] + ' records from ' + filename + ' processed.')
        txtData = []
        console.log(returnArr[i]);
        log.debug(returnArr[i]);
      }
      catch (error) {
        console.log(error);
      } 
    };    
    }
    for (let i = 0; i < files.length; i++) {
       await fs.unlink(scansFolder + files[i], function (err) {
        if (err) throw err;
        // if no error, file has been deleted successfully
        console.log(files[i] + ' deleted!');
    });  
    }
  });
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