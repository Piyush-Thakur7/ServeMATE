// ==========================================
// Sentry Initialization Configuration
// ==========================================
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://e893b4eae7def2064ccf3497c5ddf13c90@o4511708404056064.ingest.de.sentry.io/4511708410806352",
  dataCollection: {
    // Disable sending user data and HTTP bodies
    userInfo: false,
    httpBodies: [],
  },
});
