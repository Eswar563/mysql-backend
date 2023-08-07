const bcrypt = require("bcrypt");
const db = require("../db");
const express = require("express");
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);
const {sendEmail} = require("../utilities/utilities")
const queryUtilities = require("../queryUtilities/queryUtilities")
const generateJwtToken = require("../generateJwtToken/generateJwtToken")

//createUser
exports.createUser = async (request, response) => {
  const fields = {
    user_id: 'user_id',
    full_name: 'full_name',
    email_address: 'email_address',
    password: 'password',
    address: 'address',
    phone_number: 'phone_number',
    gender: 'gender',
    is_admin: 'is_admin'
  };
  const { full_name, email_address, password, address, phone_number, gender, is_admin } = request.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const rows = await queryUtilities.findUserByName("users", "full_name", full_name);
    console.log(rows)
    if (!rows) {
      const userData = {
        full_name,
        email_address,
        hashedPassword,
        address,
        phone_number,
        gender,
        is_admin
      };
      const newUserId = await queryUtilities.createUserInDB("users", fields, userData);
      await queryUtilities.sendWelcomeEmail(email_address, full_name, phone_number);
      response.send(`Created new user with ${newUserId}`);
    } else {
      response.status(400).send('User already exists');
    }
  } catch (error) {
    console.error('Error:', error);
    response.status(500).send('Internal Server Error');
  }
};

//loginUser
exports.loginUser = async (request, response) => {
  const { email_address, password } = request.body;
  try {
    const dbUser = await queryUtilities.findUserByName("users", "email_address", email_address);
    if (!dbUser) {
      return response.status(400).send("Invalid User");
    }
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      await queryUtilities.updateLoggedInStatus(email_address);
      const payload = {
        email_address: email_address,
      };
      console.log('>>>>>>>>>>>',payload)
      const jwtToken = generateJwtToken.generateJwtToken(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400).send("Invalid Password");
    }
  } catch (error) {
    console.error("DB Error:", error.message);
    response.status(500).send("Database error");
  }
};

//profile
exports.profile = async (request, response) => {
  try {
    const { email_address } = request;

    const userDetails = await queryUtilities.findUserByName("users", "email_address", email_address);

    if (!userDetails) {
      return response.status(404).send("User not found");
    }
    response.send(userDetails);
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
  
  //forgotPassword

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

  //updatePassword
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

  