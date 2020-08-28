// const fs = require('fs');
// const csv = require('csv');
// const path = require('path');
// const Imb = require('../models/imb.model');
// const db = require('../models/index');
// const readline = require('readline');
// const { once } = require('events');
// const ftp = require('basic-ftp');

// exports.processScans = async (file) => {
//     try {
//         const rl = readline.createInterface({
//           input: fs.createReadStream(file),
//           crlfDelay: Infinity
//         });
//         let fileData = [];
//         rl.on('line', (line) => {
//           // read a line of the data and split it into an array to create an object to insert into the db
//           const row = line.split(',');
//           const newScan = {
//             IMB: row[0],
//             scanDateTime: row[2],
//             scanZip: row[4],
//             phase: row[5].substr(7,2),
//             expectedDel: row[6],
//             anticipatedDel: row[7],
//           };
//           // add the object to the array to be inserted
//         fileData.push(newScan);
//         if (fileData.length > 1000) {
//           // copy the original array of data for insertion
//           const sqlData = [...fileData];
//           fileData = [];
//           db.Imb.bulkUpdate(
//             sqlData, 
//             {
//               fields: ["Imb", "scanDateTime", "scanZip", "phase", "expectedDel", "anticipatedDel"],
//             },
//           )
//           .then(() => {
//             console.log('successfully merged scan data.');
//           })
//           .catch(error => {
//             console.log(error);
//           });
//           fileData.length = 0;
//         }
//       });
//       // close the file
//       await once(rl, 'close');
//       // insert the leftover data
//       db.Imb.bulkCreate(
//         fileData,
//         {
//         fields: ["id", "name", "address"],
//         updateOnDuplicate: ["name"] 
//         },
//         )
//           .then(() => {
//             console.log('successfully merged the last bit of data.');
//             fileData = [];
//           })
//           .catch(error => {
//             console.log(error);
//           });
//       console.log('File processed.');  
//       } catch (err) {
//         console.log('Error: ', err)
//       }
// }