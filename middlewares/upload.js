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
