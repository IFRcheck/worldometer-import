require('dotenv')
  .config({ path: '../.env' });
const Crawler = require('crawler');
const mysql = require('mysql');
const express = require("express");
const app = express();
const cron = require('node-cron');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connection = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.db,
  port: process.env.port
});

const c = new Crawler({
  callback: (error, res, done) => {
    if (error) {
      console.log(error);
    } else {
      const $ = res.$;

      let rows = $("#main_table_countries_today tbody:first-of-type tr:not('.total_row_world')");
    }
    done();
  }
});

app.get('/cron', function(req, res) {
  const url = "https://www.worldometers.info/coronavirus/";
  c.queue({
    uri: url
  });
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
