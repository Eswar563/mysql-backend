const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const db = require("../db");
const express = require("express");
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);
const nodemailer = require("nodemailer");

//createUser
exports.createUser = async (request, response) => {
  const { username, email, name, password, gender, location } = request.body;

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
          user (username, email, name, password, gender, location) 
        VALUES 
          (?, ?, ?, ?, ?, ?)`;
      db.query(createUserQuery, [username, email, name, hashedPassword, gender, location], (err, result) => {
        if (err) {
          console.error("DB Error:", err.message);
          return response.status(500).send("Database error");
        }

        // Send an email to the new user using Nodemailer
        const transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: "evv.pedagadi365@gmail.com", 
            pass: "hbesptsbwfcjliri", 
          },
        });
        
        const emailContent = `
        <html>
        <head>
          <style>
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }

            .animated-text {
              animation: fadeInUp 1s ease;
              color: #007bff; /* Replace with your desired text color */
              position: relative; /* Required for the ::after pseudo-element to position properly */
              display: inline-block; /* Ensure ::after pseudo-element takes the size of the text */
            }

            .animated-text:hover::after {
              content: "";
              position: absolute;
              top: -5px;
              left: -5px;
              right: -5px;
              bottom: -5px;
              border-radius: 5px;
              background-color: rgba(0, 123, 255, 0.4); /* Replace with your desired glow color and opacity */
              pointer-events: none; /* Ensures that the pseudo-element doesn't interfere with hover effect */
            }
          </style>
        </head>
        <body>
          <h2 class="animated-text">Hello ${name},</h2>
          <p class="animated-text">Thank you for joining our website! Your username is: <strong>${username}</strong></p>
          <p class="animated-text">Regards,<br>Your Website Team</p>
        </body>
      </html>
      `;
        const mailOptions = {
          from: "evv.pedagadi365@gmail.com", 
          to: email, 
          subject: "Welcome to Our Website",
          html:emailContent
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Email Error:", error.message);
            return response.status(500).send("Error sending email");
          }
          console.log("Email sent:", info.response);
          const newUserId = result.insertId;
          response.send(`Created new user with ${newUserId}`);
        });
      });
    } else {
      response.status(400).send("User already exists");
    }
  });
};


//loginUser
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


  //profile
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
  
  exports.updateProfile = async (request, response) => {
    const { id } = request.params;
    const userDetails = request.body;

    const {
      username,
      name,
      password,
      gender,
      location,
    } = userDetails;
    const hashedPassword = await bcrypt.hash(password, 10);
    const updateUserQuery = `
      UPDATE user
      SET
        username = ?,
        name = ?,
        password = ?,
        gender = ?,
        location = ?
      WHERE
        id = ?;`;
  
    const values = [username, name, hashedPassword, gender, location, id];
  
    db.query(updateUserQuery, values, (error, results) => {
      if (error) {
        console.error('Error updating user in MySQL:', error);
        return response.status(500).json({ message: 'Error updating user' });
      }
  
      if (results.affectedRows === 0) {
        return response.status(404).json({ message: 'User not found' });
      }
  
      response.send("User Updated Successfully");
    });
  };
  