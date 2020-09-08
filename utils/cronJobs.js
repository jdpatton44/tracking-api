const cron = require("node-cron");
const scanController = require('../controllers/scanController');


cron.schedule("59 1 * * *", async function() {
  await scanController.getFilesFromFTP();
});

cron.schedule("59 3 * * *", async function() {
  await scanController.uploadScanData();
});