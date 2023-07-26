const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const db = require("../db");
const express = require("express");

const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);

exports.createUser = async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
  db.query(selectUserQuery, [username], async (err, rows) => {
    if (err) {
      console.error("DB Error:", err.message);
      return response.status(500).send("Database error");
    }

    if (rows.length === 0) {
      const createUserQuery = `
        INSERT INTO 
          user (username, name, password, gender, location) 
        VALUES 
          (?, ?, ?, ?, ?)`;
      db.query(createUserQuery, [username, name, hashedPassword, gender, location], (err, result) => {
        if (err) {
          console.error("DB Error:", err.message);
          return response.status(500).send("Database error");
        }
        const newUserId = result.insertId;
        response.send(`Created new user with ${newUserId}`);
      });
    } else {
      response.status(400).send("User already exists");
    }
  });
};


exports.loginUser = async (request, response) => {
    const { username, password } = request.body;
    const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
  
    db.query(selectUserQuery, [username], async (err, rows) => {
      if (err) {
        console.error("DB Error:", err.message);
        return response.status(500).send("Database error");
      }
  
      if (rows.length === 0) {
        response.status(400).send("Invalid User");
      } else {
        const dbUser = rows[0];
        const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
  
        if (isPasswordMatched) {
          const payload = {
            username: username,
          };
          const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
          response.send({ jwtToken });
        } else {
          response.status(400).send("Invalid Password");
        }
      }
    });
  };



  exports.profile = async (request, response) => {
    try {
      const { username } = request;
      const selectUserQuery = `SELECT * FROM user WHERE username = ?`;
  
      db.query(selectUserQuery, [username], async (err, rows) => {
        if (err) {
          console.error("DB Error:", err.message);
          return response.status(500).send("Database error");
        }
  
        if (rows.length === 0) {
          response.status(404).send("User not found");
        } else {
          const userDetails = rows[0];
          response.send(userDetails);
        }
      });
    } catch (error) {
      console.error("Error:", error.message);
      response.status(500).send("Internal server error");
    }
  };
  
  

  
