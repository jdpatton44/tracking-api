const multer = require('multer');


// upload file path
const FILE_PATH = 'uploads';

const excelFilter = (req, file, cb) => {
    if (
      file.mimetype.includes("excel") ||
      file.mimetype.includes("spreadsheetml")
    ) {
      cb(null, true);
    } else {
      cb("Please upload only excel file.", false);
    }
  };

// configure multer
const upload = multer({
    dest: `${FILE_PATH}/`,
    fileFilter: excelFilter,
});

module.exports = upload;