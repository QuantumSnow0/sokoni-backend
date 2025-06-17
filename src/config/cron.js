import { CronJob } from "cron";
import https from "https";

const job = new CronJob("*/14 * * * *", function () {
  https.get(process.env.API_URL, (res) => {
    if (res.statusCode === 200) {
      console.log("Request sent successfully");
    } else {
      console.log("Failed to send request. Status code:", res.statusCode);
    }
  }).on("error", (e) => {
    console.error("An error has occurred on cron:", e);
  });
});

export default job;
