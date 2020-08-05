const express = require('express');
const upload = require('../middlewares/upload')
// const { catchErrors } = require('../handlers/errorHandlers');

const router = express.Router();

router.post('/upload-file', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;

        // make sure file is available
        if (!file) {
            res.status(400).send({
                status: false,
                data: 'No file is selected.'
            });
        } else {
            // send response
            res.send({
                status: true,
                message: 'File is uploaded.',
                data: {
                    name: file.originalname,
                    mimetype: file.mimetype,
                    size: file.size
                }
            });
        }

    } catch (err) {
        res.status(500).send(err);
    }
});

module.exports = router;