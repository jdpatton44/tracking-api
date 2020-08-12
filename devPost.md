# Uploading a Large File to MySQL in Node

## The Challenge

For the past few months I have been picking up development for fun in my spare time at work.  After building a few small apps I thought I would try to figure out how to track bulk mail.  First I created a small React app to check on a single piece of mail using the IMb (Intelligent Mail barcode) and the USPS API.  Then thought it might be interesting to try to track whole jobs.  To track a job with a few million pieces will require a much different approach.  I broke this problem down into a few steps.  

- upload a file of IMbs to the a Node.js backend 
- read the IMbs into a database
- upload a file of scan data from the USPS
- match the scans with the IMbs and update those records in the database
- create a percentage scanned for each mailing  
  
## Uploading the IMb File

I am using Node for this project, and uploading the tracking file was pretty straight forward using Multer. I added it to the project, set it up as a middleware, 

        const multer = require('multer');

        // upload file path
        const FILE_PATH = 'uploads';

        const csvFilter = (req, file, cb) => {
        if (file.mimetype.includes('text') || file.mimetype.includes('csv')) {
            cb(null, true);
        } else {
            cb('Please upload only text/csv file.', false);
        }
        };

        // configure multer
        const upload = multer({
        dest: `${FILE_PATH}/`,
        fileFilter: csvFilter,
        });

        module.exports = upload;

Then I created a function for the route to save the file to an uploads folder.  

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
                // send response if file was uploaded
                await res.status(200).send({
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
## Inserting into MySQL
The next step was more challenging.  Once the file was uploaded, I researched a few different ways to move the data into MySQL and settled on streaming the file, pushing each record into an array then inserting the data into the database with sequelize `bulkCreate` when the array reaches 5,000 records, then deleting the array.  This worked out alright when I did smaller files, but as they grew, I noticed that not all of the records were being inserted.  It seemed like the array that was being used to insert the data was getting overwritten before all of the records were inserted. To fix that issue, I made an object and created a new array property on it for each iteration, then delete the property once that chunk was uploaded.  That didnt work out well, and over complicated things. I thought about it some more and decided to try coping the array (csvData) I was pushing the IMb records to by spreading the original array into a new one (sqlData).  Then setting the original array (csvData) to an empty array to clear it, and using the new array to insert the data. I tried several other implementation along the way, but this one worked for a file with over 1,000,000 records, which made me very happy.


        exports.exportTrackingFileToDB = async (req, res) => {
            // get the file's location
            const filePath = path.join(__dirname, '../', req.file.path);
            console.log('attempting upload to db.');
            
            try {
                if (req.file == undefined) {
                return res.status(400).send('No file found.');
                }
                (async function processLineByLine() {
                try {
                    const rl = readline.createInterface({
                    input: fs.createReadStream(filePath),
                    crlfDelay: Infinity
                    });
                    let csvData = [];
                    rl.on('line', (line) => {
                    // read a line of the data and split it into an array to create an object to insert into the db
                    const row = line.split(',');
                    const newImb = {
                        jobid: req.body.jobId,
                        // use substring to get rid of quotes around the data
                        IMB: row[0].substring(1,row[0].length-1),
                        zipPlusFour: row[1].substring(1,row[1].length-1),
                        state: row[2].substring(1,row[2].length-1),
                        package: row[3].substring(1,row[3].length-1),
                    };
                    // add the object to the array to be inserted
                    csvData.push(newImb);
                    if (csvData.length > 5000) {
                        // copy the original array of data for insertion
                        const sqlData = [...csvData];
                        csvData = [];
                        db.Imb.bulkCreate(sqlData)
                        .then(() => {
                        console.log('successfully inserted data.');
                        })
                        .catch(error => {
                        console.log(error);
                        });
                        csvData.length = 0;
                    }
                    });
                    // close the file
                    await once(rl, 'close');
                    // insert the leftover data
                    db.Imb.bulkCreate(csvData)
                        .then(() => {
                        console.log('successfully inserted the last bit of data.');
                        csvData = [];
                        })
                        .catch(error => {
                        console.log(error);
                        });
                    console.log('File processed.');
                } catch (error) {
                    console.error(error);
                }
                })();
            } catch (error) {
            console.error(error);
            }
        }



## Next Steps
I am sure there are much better ways of doing this, but I went from failing on 2,000 records, to pushing over 1,000,000!  The Node documentation was super helpful with this. 

The next step is either using the API to get scan data from the USPS, or getting a file of scans from an FTP and after that matching the IMbs, then calculating a scan percentage for the job.  

Thanks for reading my first post and please comment and let me know how I can improve.