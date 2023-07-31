const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")

const db = require("../db");
const express = require("express");
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);
const nodemailer = require("nodemailer");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
//createUser
exports.createUser = async (request, response) => {
  const { full_name, email_address, password, address,  phone_number, gender } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM users WHERE full_name = ?`;
  db.query(selectUserQuery, [full_name], async (err, rows) => {
    if (err) {
      console.error("DB Error:", err.message);
      return response.status(500).send("Database error");
    }

    if (rows.length === 0) {
      const user_id = uuidv4();
      const createUserQuery = `
        INSERT INTO 
          users (user_id, full_name, email_address, password, address,  phone_number, gender) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?)`;
      db.query(createUserQuery, [user_id, full_name, email_address, hashedPassword, address,  phone_number, gender], (err, result) => {
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
        
        fs.readFile('emailTemplate.html', 'utf8', (err, emailTemplate) => {
          if (err) {
            console.error("Error reading email template:", err.message);
            return response.status(500).send("Error reading email template");
          }

          // Replace placeholders with actual data
          const emailContent = emailTemplate
            .replace('{{full_name}}', full_name)
            .replace('{{phone_number}}', phone_number);

          const mailOptions = {
            from: "evv.pedagadi365@gmail.com",
            to: email_address,
            subject: "Welcome to Our Website",
            html: emailContent,
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
      });
    } else {
      response.status(400).send("User already exists");
    }
  });
};


//loginUser
exports.loginUser = async (request, response) => {
    const { email_address, password } = request.body;
    const selectUserQuery = `SELECT * FROM users WHERE email_address = ?`;
  
    db.query(selectUserQuery, [email_address], async (err, rows) => {
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
            email_address: email_address,
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
      const { email_address} = request;
    
      const selectUserQuery = `SELECT * FROM users WHERE email_address = ?`;
  
      db.query(selectUserQuery, [email_address], async (err, rows) => {
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
  