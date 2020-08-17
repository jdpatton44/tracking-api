const express = require('express');
const upload = require('../middlewares/upload');
const imbController = require('../controllers/imbController');
const ftp = require('../middlewares/ftpClient')
// const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

router.post('/upload-file', upload.single('file'), imbController.uploadFile, imbController.exportTrackingFileToDB);

router.get('/checkFtp', imbController.getFileFromFTP);

module.exports = router;
