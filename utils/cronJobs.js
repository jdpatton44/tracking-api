const cron = require("node-cron");
const scanController = require('../controllers/scanController');


cron.schedule("* 6 * * *", function() {
    scanController.getFilesFromFTP();
  });