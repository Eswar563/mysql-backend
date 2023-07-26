// dbConfig.js
const mysql = require("mysql");

const dbConfig = {
  host: "localhost",
  user: "sqluser",
  password: "123456789",
  database: "users",
};

const db = mysql.createConnection(dbConfig);

module.exports = db;
