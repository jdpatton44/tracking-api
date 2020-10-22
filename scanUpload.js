
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
          uploadUspsFile(scansFolder + files[0]);
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

const uploadUspsFile = (file) => {
    let = txtData = [];
    try {
    const dataStream = fs.createReadStream(file)
        .pipe(es.split())
        .pipe(es.mapSync( async function(line) {
            const filename = files[i];
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
        })).on('error', function(error) {
            console.log('Error reading file.')
        }). on('end', async function() {
            if (txtData.length > 0)  {
                // insert the leftover data
                await db.scan.bulkCreate(txtData);
                console.log('inserted ' + txtData.length + ' records.')
                returnArr[i] = (fileRecords[files[i]] + ' records from ' + filename + ' processed.')
                txtData = []
                console.log(returnArr[i]);
                log.debug(returnArr[i]);
            }
        })
    
    } catch (error) {
    console.log(error);
    }
};