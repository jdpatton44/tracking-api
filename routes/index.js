const express = require('express');
const asyncHandler = require('express-async-handler')
const upload = require('../middlewares/upload');
const imbController = require('../controllers/imbController');
const scanController = require('../controllers/scanController');
const db = require('../models');
// const ftp = require('../middlewares/ftpClient')
// const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

router.post('/upload-file', upload.single('file'), imbController.uploadFile, imbController.exportTrackingFileToDB);

router.get('/checkFtp', asyncHandler(async(req, res) => {
    const fileList = await scanController.getFilesFromFTP();
    res.status(200).send({
        status: true,
        message: fileList,
    })
}));

router.get('/uploadScans', asyncHandler(async(req, res) => {
    const uploadList = await scanController.uploadScanData();
    res.status(200).send({
        status: true,
        message: uploadList
    });
}));

router.get('/scansbyDate', scanController.getJobScansByDate);

router.get('/matches', asyncHandler(async(req, res) => {
    const matches = await scanController.joinScansAndImbs();
    res.status(200).send({
        status: true,
        message: matches,
    });
}));

module.exports = router;
