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
        next();
      }
      catch(err) {
        console.log(err);
      }
      client.close();
    }
   const fileList = downloadFiles();
   next();
 }

 exports.uploadScanData = async (req, res, next) => {
  const scansFolder = '/uploads/scanData/'
  // check for files in directory.
  
  });




//   (async function processLineByLine() {
//     try {
//       const rl = readline.createInterface({
//         input: fs.createReadStream(filePath),
//         crlfDelay: Infinity
//       });
//       let csvData = [];
//       rl.on('line', (line) => {
//         // read a line of the data and split it into an array to create an object to insert into the db
//         const row = line.split(',');
//         const newImb = {
//           jobid: req.body.jobId,
//           // use substring to get rid of quotes around the data
//           IMB: row[0].substring(1,row[0].length-1),
//           zipPlusFour: row[1].substring(1,row[1].length-1),
//           state: row[2].substring(1,row[2].length-1),
//           package: row[3].substring(1,row[3].length-1),
//         };
//         // add the object to the array to be inserted
//         csvData.push(newImb);
//         if (csvData.length > 5000) {
//           // copy the original array of data for insertion
//           const sqlData = [...csvData];
//           csvData = [];
//           db.Imb.bulkCreate(sqlData)
//           .then(() => {
//             console.log('successfully inserted data.');
//           })
//           .catch(error => {
//             console.log(error);
//           });
//           csvData.length = [];
//         }
//       });
//       // close the file
//       await once(rl, 'close');
//       // insert the leftover data
//       db.Imb.bulkCreate(csvData)
//           .then(() => {
//             console.log('successfully inserted the last bit of data.');
//             csvData = [];
//           })
//           .catch(error => {
//             console.log(error);
//           });
//       console.log('File processed.');
//     } catch (error) {
//       console.error(error);
//     }
//   })();
// } catch (error) {
// console.error(error);
// }
// next();
 }