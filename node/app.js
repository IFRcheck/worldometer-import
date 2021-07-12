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

// Function to empty DB and reset AI and call the Cron-Crawler
function dbTask() {
  console.log("DB Caller");
  connection.query('TRUNCATE TABLE covid_numbers', function(error, results, fields) {
    if (error) {
      console.log(error);
    }
  });
  connection.query('ALTER TABLE covid_numbers AUTO_INCREMENT = 1', function(error, results, fields) {
    if (error) {
      console.log(error);
    }
  });
  const url = "https://www.worldometers.info/coronavirus/";
  c.queue({
    uri: url
  });
}

// Function to update Database from Cronjob
function updateDatabase(country, infections, deaths, population, ifr, aboveIoannidis, cfr) {
  let sql = `INSERT INTO covid_numbers
  (
    country, infections, deaths, population, IFR, aboveIoannidis, CFR, date
  )
  VALUES
  (
    ?, ?, ?, ?, ?, ?, ?, SYSDATE()
  )`;

  connection.query(sql, [country, infections, deaths, population, ifr, aboveIoannidis, cfr], function(error, results, fields) {
    if (error) {
        console.log(error);
    }
  });
}

// Crawler for Cron
const c = new Crawler({
  callback: (error, res, done) => {
    if (error) {
      console.log(error);
    } else {
      const $ = res.$;

      let rows = $("#main_table_countries_today tbody:first-of-type tr:not('.total_row_world')");

      for (var i = 0; i < rows.length; i++) {
        let cRow = rows[i];
        let country = $(cRow)
          .find("td:nth-of-type(2)")
          .text();
        let infections = $(cRow)
          .find("td:nth-of-type(3)")
          .text();
        infections = parseInt((infections.replace(/,/g, '')));
        let deaths = $(cRow)
          .find("td:nth-of-type(5)")
          .text();
        if (deaths === " ") {
          deaths = 0;
        } else {
          deaths = parseInt((deaths.replace(/,/g, '')));
        }
        let population = $(cRow)
          .find("td:nth-of-type(15)")
          .text();
        population = parseInt((population.replace(/,/g, '')));

        let ifr = (deaths / (population / 100));

        ifr = Math.round((ifr + Number.EPSILON) * 100) / 100;

        let aboveIoannidis = 0;

        if(ifr > 0.15) {
          aboveIoannidis = 1;
        }

        let cfr = (deaths / (infections / 100));

        cfr = Math.round((cfr + Number.EPSILON) * 100) / 100;

        if (country === "MS Zaandam" || country === "Diamond Princess") {} else {
          updateDatabase(country, infections, deaths, population, ifr, aboveIoannidis, cfr);
        }
      }
    }
    done();
  }
});

//Cron:
/*cron.schedule('59 * * * * *', () => {
  dbTask();
}, {
  scheduled: true,
  timezone: "Europe/Berlin"
}); */

// API Starts here
app.get('/', function(req, res) {
  res.send("<h1>API working.</h1>");
});

app.get('/getData', function(req, res) {
  const apiUser = process.env.apiUser;
  let reqUser = req.query.user;
  if (reqUser === apiUser) {
    //res.send("<p>Yay! It worked!</p>");
    let argument = req.query.argument;
    let sql = `SELECT * from covid_numbers WHERE ` + argument + ` `;
    connection.query(sql, function(error, results, fields) {
      if(error) {
        res.send("You made this Error: " + error);
      }
      if(results) {
        if(results.length > 0) {
          res.send(results);
        } else {
          res.send("No entries.");
        }
      }
    });
  } else {
    res.send("Access denied");
    return false;
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
