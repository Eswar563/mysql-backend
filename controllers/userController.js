const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken")
const db = require("../db");
const express = require("express");
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const {sendEmail} = require("../utilities/utilities")

//createUser
exports.createUser = async (request, response) => {
  const { full_name, email_address, password, address, phone_number, gender } = request.body;

  const hashedPassword = await bcrypt.hash(password, 10);

  const selectUserQuery = `SELECT * FROM users WHERE full_name = ?`;
  db.query(selectUserQuery, [full_name], async (err, rows) => {
    if (err) {
      console.error('DB Error:', err.message);
      return response.status(500).send('Database error');
    }

    if (rows.length === 0) {
      const user_id = uuidv4();
      const createUserQuery = `
        INSERT INTO 
          users (user_id, full_name, email_address, password, address,  phone_number, gender) 
        VALUES 
          (?, ?, ?, ?, ?, ?, ?)`;
      db.query(createUserQuery, [user_id, full_name, email_address, hashedPassword, address, phone_number, gender], (err, result) => {
        if (err) {
          console.error('DB Error:', err.message);
          return response.status(500).send('Database error');
        }

        fs.readFile('emailTemplate.html', 'utf8', async (err, emailTemplate) => {
          if (err) {
            console.error('Error reading email template:', err.message);
            return response.status(500).send('Error reading email template');
          }

          // Replace placeholders with actual data
          const emailContent = emailTemplate
            .replace('{{full_name}}', full_name)
            .replace('{{phone_number}}', phone_number);

          try {
            await sendEmail(email_address, 'Welcome to Our Website', emailContent);
            const newUserId = result.insertId;
            response.send(`Created new user with ${newUserId}`);
          } catch (error) {
            console.error('Error sending email:', error.message);
            return response.status(500).send('Error sending email');
          }
        });
      });
    } else {
      response.status(400).send('User already exists');
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
        const updateLoggedInQuery = `UPDATE users SET last_logged_in = NOW(),isActive = true WHERE email_address = ?`;
        db.query(updateLoggedInQuery, [email_address], (updateErr, updateResult) => {
          if (updateErr) {
            console.error("Error updating last logged in time:", updateErr.message);
          }

          const payload = {
            email_address: email_address,
          };
          const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
          response.send({ jwtToken });
        });
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
  
  //updateProfile
  exports.updateProfile = async (request, response) => {
    const { id } = request.params;
    const userDetails = request.body;
    const {
      full_name, email_address,  address,  phone_number, gender, password
    } = userDetails;
    const hashedPassword = await bcrypt.hash(password, 10);

    const updateUserQuery = `
      UPDATE users
      SET
      full_name = ?,
      email_address = ?,
      address = ?,
      phone_number = ?,
      gender = ?,
      password = ?,
      updated_at = NOW()
      WHERE
        id = ?;`;
  
    const values = [full_name, email_address,  address,  phone_number, gender, hashedPassword,  id];
  
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
  
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  exports.forgotPassword = async (req, res) => {
    const { email_address } = req.body;
  
    // Check if the email exists in the database
    db.query('SELECT * FROM users WHERE email_address = ?', [email_address], async (err, result) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      if (result.length === 0) {
        return res.status(404).json({ error: 'Email not found' });
      }
  
      // Generate a random 6-digit OTP
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 600000); // OTP valid for 10 minutes
  
      // Save the OTP and its expiry in the database
      db.query('UPDATE users SET otp = ?, otp_expiry = ? WHERE email_address = ?', [otp, otpExpiry, email_address], async (err) => {
        if (err) {
          console.error('Error updating the database: ' + err.stack);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        // Send the OTP to the user's email
        const subject = 'OTP for Password Reset';
        const text = `Your OTP for password reset is: ${otp}. 
        Enter the OTP in the link below to reset your password:
        https://update-password.netlify.app/`;
  
        try {
          await sendEmail(email_address, subject, text);
          return res.json({ message: 'OTP sent successfully' });
        } catch (error) {
          console.error('Error sending email: ' + error.stack);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
      });
    });
  };


  exports.updatePassword = async (req, res) => {
    const { email_address, otp, newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);
  
    // Check if the OTP and email match in the database
    db.query('SELECT * FROM users WHERE email_address = ? AND otp = ? AND otp_expiry > NOW()', [email_address, otp], (err, result) => {
      if (err) {
        console.error('Error querying the database: ' + err.stack);
        return res.status(500).json({ error: 'Internal Server Error' });
      }
  
      if (result.length === 0) {
        return res.status(401).json({ error: 'Invalid OTP or expired' });
      }
  
      // Update the user's password in the database
      db.query('UPDATE users SET password = ? WHERE email_address = ?', [hashedPassword, email_address], (err) => {
        if (err) {
          console.error('Error updating the database: ' + err.stack);
          return res.status(500).json({ error: 'Internal Server Error' });
        }
  
        // Clear the OTP and its expiry from the database
        db.query('UPDATE users SET otp = NULL, otp_expiry = NULL WHERE email_address = ?', [email_address], async (err) => {
          if (err) {
            console.error('Error updating the database: ' + err.stack);
            return res.status(500).json({ error: 'Internal Server Error' });
          }
  
          // Send the password update notification email
          const subject = 'Password Update Notification';
          const text = 'Your password has been updated successfully.';
  
          try {
            await sendEmail(email_address, subject, text);
            console.log('Password update email sent successfully to ' + email_address);
          } catch (error) {
            console.error('Error sending email: ' + error.stack);
          }
  
          return res.json({ message: 'Password updated successfully' });
        });
      });
    });
  };

  