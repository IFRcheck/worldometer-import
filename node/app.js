require('dotenv')
  .config({ path: '../.env' });
const Crawler = require('crawler');
const { getDomainWithoutSuffix } = require('tldts');
const mysql = require('mysql');
const express = require("express");
const fs = require("fs");
const app = express();
const results = require('./assets/result.json');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

var connection = mysql.createConnection({
  host: process.env.host,
  user: process.env.user,
  password: process.env.password,
  database: process.env.db,
  port: process.env.port
});
