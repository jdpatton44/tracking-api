const fs = require('fs');
const path = require('path');
const db = require('../models/index');
const ftp = require('basic-ftp');
const log = require('log4js').getLogger("downloads");
const sequelize = require('sequelize');
const es = require('event-stream');


const MAXINPUT = 20000;

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
        console.table(files)
        const fileNames = await files.map(f => f.name)
        log.debug(`retrieving files: ${fileNames} from FTP`);
        client.trackProgress(info => {
          const f = fileNames.indexOf(info.name)
          files[f] ? console.log(info.name, ": ", Math.floor((info.bytes / files[f].size) * 10000) / 100, '%') : console.log('')
          }
        );
        // client.trackProgress(info => console.table(info))
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
          console.log(files[i]);
          await uploadUspsFile(scansFolder + files[i]);
      } 
    }});
  //   for (let i = 0; i < files.length; i++) {
  //      await fs.unlink(scansFolder + files[i], function (err) {
  //       if (err) throw err;
  //       // if no error, file has been deleted successfully
  //       console.log(files[i] + ' deleted!');
  //   });  
  //   }
  // };
  return returnArr; 
  };

  exports.getJobScansByDate = async (req, res, next) => {
    const { jobId } = req.body;
    const scansByDate = await db.sequelize.query(
      'CALL SP_getJobScansByDate( :jobId)', 
      {replacements: {jobId: jobId}, type: sequelize.QueryTypes.SELECT}
    );
    res.json(scansByDate);
  }

  exports.getPackageScansByDate = async (req, res, next) => {
    const { jobId, package } = req.body;
    const scansByDate = await db.sequelize.query(
      'CALL SP_getPackageScansByDate( :jobId, :package)', 
      {replacements: {jobId, package}, type: sequelize.QueryTypes.SELECT}
    );
    res.json(scansByDate);
  }

  const uploadUspsFile = (file) => {
    let txtData = []
    let = txtData[file] = [];
    try {
    const dataStream = fs.createReadStream(file)
        .pipe(es.split())
        .pipe(es.mapSync( async function(line) {
            const filename = file;
            // read a line of the data and split it into an array to create an object to insert into the db
            const row = line.split(',');
            if(row[0].includes('Imb')) return; 
            if(!row[0]) return;
            const mailPhase = row[5] ? row[5].substr(6,2) : '';
            const newScan = {
            // use substring to get rid of quotes around the data
            IMB: row[0],
            scanDateTime: row[2],
            scanZip: row[4],
            mailPhase,
            expectedDel: row[6],
            anticipatedDel: row[7],
            fileCode: file.substr(-16,12),
            };
            // add the object to the array to be inserted if it is a valid IMB
            if(newScan.IMB.length > 20) {
                txtData[file].push(newScan);
                //fileRecords[files[i]]++;
            }
            if (txtData[file].length > MAXINPUT) {
            // copy the original array of data for insertion
                const sqlData = [...txtData[file]];
                txtData[file] = [];
                console.log('inserted ' + sqlData.length + ' records.');
                await db.scan.bulkCreate(sqlData);
            }
        })).on('error', function(error) {
            console.log('Error reading file.')
        }). on('end', async function() {
            if (txtData[file].length > 0)  {
                // insert the leftover data
                await db.scan.bulkCreate(txtData[file]);
                console.log('inserted the last ' + txtData[file].length + ' records of ' + file + '!')
                //returnArr[i] = (fileRecords[files[i]] + ' records from ' + filename + ' processed.')
                txtData[file] = []
                //console.log(returnArr[i]);
                //log.debug(returnArr[i]);
            }
        })
    
    } catch (error) {
    console.log(error);
    }
};