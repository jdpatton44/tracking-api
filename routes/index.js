const express = require('express');
const upload = require('../middlewares/upload');
const imbController = require('../controllers/imbController');
// const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

router.post('/upload-file', upload.single('file'), imbController.uploadFile, imbController.exportFileToDB);

module.exports = router;
