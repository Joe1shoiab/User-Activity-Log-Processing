const express = require("express");
const config = require('./config');

const app = express();

app.get("/", (req, res) => {
  res.send("User Activity Log Processing service!");
});

app.listen(config.server.port, () => {
  console.log(`App listening at http://localhost:${config.server.port}`);
});

module.exports = app;
