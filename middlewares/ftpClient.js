require('dotenv').config({ path: 'process.env' });
const fs = require('fs');
let Client = require('ssh2-sftp-client');
let sftp = new Client();

const connectionOptions = {
    host: process.env.FTP_HOST,
    port: process.env.FTP_PORT,
    username: process.env.FTP_USER,
    password: process.env.FTP_PASS,
  }

function getConnection(){
    return sftp.connect(connectionOptions);
  }
var connection = getConnection();

const serverPath = 'uploads';

function getFiles(connection, serverPath, localPath, callback) {
    return new Promise(function (resolve, reject) {
      connection
        .then(() => {
          return sftp.list(serverPath);
        })
        .then((data) => {
  
          // get list of downloaded server filenames
          var downloadedFiles = _.map(logFile.downloadedFiles, function(lf){
            return lf.serverFilename;
          });
  
          // filter out filenames of things we already have
          var filesToGet = _.filter(data, function (file) {
            return downloadedFiles.indexOf(serverPath + "/" +file.name) == -1;
          });
  
          // for each file we need to get -> drill down and get everything
          var getFilesPromiseMap = Promise.map(filesToGet, function (fileInfo) {
            return new Promise(function (resolveMap, rejectMap) {
  
              var serverFilename = serverPath + "/" + fileInfo.name;
              var localFilename = localPath + "/" + fileInfo.name;
  
              // if file is not directory -> download it
              if (fileInfo.type != "d") {
                try {
                  log.infoLog("\nDownload Started: " +
                    "\n\tServer Filename: " + serverFilename +
                    "\n\tLocal Filename: " + localFilename);
  
                  // start timer to show progress:
                  // show progress bar : start at 0
  
                  var progressUpdateInterval;
                  var progressString = '  downloading [:bar] :rate/bps :percent :etas';
                  var bar = new ProgressBar(progressString, {
                    complete: '=',
                    incomplete: ' ',
                    width: 50,
                    total: fileInfo.size,
                    callback:function(){
                      var stats = fs.statSync(localFilename);
                      var fileSizeInBytes = stats.size;
                      log.infoLog("Downloaded: [local:"+ fileSizeInBytes + ", server: "+ fileInfo.size +"]");
                      clearInterval(progressUpdateInterval);
                    }
                  });
  
                  setTimeout(function(){
  
                    var previousFileSize;
                    progressUpdateInterval = setInterval(function(){
  
                      // check local file byte size and divide by total byte size for percentage
                      var stats = fs.statSync(localFilename);
                      var fileSizeInBytes = stats.size;
                      var sizeStep = fileSizeInBytes;
  
                      if(previousFileSize){
                        sizeStep = fileSizeInBytes - previousFileSize;
                      }
                      previousFileSize = fileSizeInBytes;
  
                      var percentage =  fileSizeInBytes / fileInfo.size;
                      percentage = parseFloat(Math.round(percentage * 100)).toFixed(2);
                      // console.log("Filename: "+ localFilename +" percentage: " + percentage);
                      bar.tick(sizeStep);
  
                    }, 250); // every half sec
  
                  }, NUM_SECS * 1000);
  
                  ssh.getFile(connectionOptions,
                    serverFilename, localFilename,
                    (err, server, connection) => {
                      if (err) log.errorLog("getFile Error: " + err);
                      else {
                        // console.log("\nFile Download Success: " +
                        //   "\n\tServer Filename: " + serverFilename +
                        //   "\n\tLocal Filename: " + localFilename);
  
                        // add to list of files that already downloaded
                        logFile.downloadedFiles.push({serverFilename:serverFilename, localFilename:localFilename, size:fileInfo.size});
                        updateLogFile();
                      }
                      resolveMap();
                    });
  
                } catch (e) {
                  log.errorLog("Download Failed with exception: " + e);
                }
  
              } else {
                // if local directory doesnt exist yet create it
                mkdirp(localFilename,
                  function (err) {
  
                    if (err) {
                      log.errorLog("mkdir Error: " + err);
                      resolveMap();
                    } else {
                      log.successLog("Downloading files for: [" + serverFilename + " -> " + localFilename + " ]");
                      // if its a directory -> call recursively
                      getFiles(connection, serverFilename, localFilename)
                        .then(resolveMap, rejectMap);
                    }
                  });
              }
  
            });
          }, {concurrency: MAX_SIMULTANEOUS_FILE_DOWNLOADS});
  
          // after map completes downloading
          getFilesPromiseMap.then(function () {
            resolve();
          }, function () {
            reject();
          });
  
        })
        .catch((err) => {
          log.errorLog(err, 'catch error');
        });
    });
  }

