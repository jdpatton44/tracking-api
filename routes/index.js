const express = require('express');
const asyncHandler = require('express-async-handler')
const upload = require('../middlewares/upload');
const imbController = require('../controllers/imbController');
const scanController = require('../controllers/scanController');
const ftp = require('../middlewares/ftpClient')
// const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

// TODO: Async Handler? - https://zellwk.com/blog/async-await-express/ 

router.post('/upload-file', upload.single('file'), imbController.uploadFile, imbController.exportTrackingFileToDB);

router.get('/checkFtp', asyncHandler(async(req, res) => {
    await scanController.getFilesFromFTP() 
}));

router.get('/uploadScans', asyncHandler(async(req, res) => {
    await scanController.uploadScanData()
}));

module.exports = router;
