const db = require("../db"); 
const {sendEmail} = require("../utilities/utilities")
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');


selectUserQuery = (tableName, fieldName, fieldValue) => `SELECT * FROM ${tableName} WHERE ${fieldName} = ?`;
exports.findUserByName = async (tableName, fieldName, fieldValue) => {
  console.log(fieldValue)
  return new Promise((resolve, reject) => {
    db.query(selectUserQuery(tableName, fieldName), [fieldValue], (err, rows) => {
      if (err) {
        console.error('DB Error:', err.message);
        return reject('Database error');
      }
      resolve(rows.length > 0 ? rows[0] : null);    
    });
  });
};


exports.updateLoggedInStatus = (email_address) => {
  return new Promise((resolve, reject) => {
    const updateLoggedInQuery = `UPDATE users SET last_logged_in = NOW(), isActive = true WHERE email_address = ?`;
    db.query(updateLoggedInQuery, [email_address], (updateErr, updateResult) => {
      if (updateErr) {
        reject(updateErr);
      }
      resolve();
    });
  });
};



exports.createUserInDB = async (tableName, fields, userData) => {
  console.log(userData, '<<<<<<<<<<<<<<<<<<')
  const {
    full_name,
    email_address,
    hashedPassword,
    address,
    phone_number,
    gender,
    is_admin
  } = userData;

  const user_id = uuidv4();
  const createUserQuery = `
    INSERT INTO 
      ${tableName} (${fields.user_id}, ${fields.full_name}, ${fields.email_address}, ${fields.password}, ${fields.address}, ${fields.phone_number}, ${fields.gender}, ${fields.is_admin}) 
    VALUES 
      (?, ?, ?, ?, ?, ?, ?, ?)`;

  return new Promise((resolve, reject) => {
    db.query(
      createUserQuery,
      [user_id, full_name, email_address, hashedPassword, address, phone_number, gender, is_admin],
      (err, result) => {
        if (err) {
          console.error('DB Error:', err.message);
          return reject('Database error');
        }
        const newUserId = result.insertId;
        resolve(newUserId);
      }
    );
  });
};

exports.sendWelcomeEmail = async (email_address, full_name, phone_number) => {
  try {
    const emailTemplate = fs.readFileSync('emailTemplate.html', 'utf8');
    const emailContent = emailTemplate
      .replace('{{full_name}}', full_name)
      .replace('{{phone_number}}', phone_number);

    await sendEmail(email_address, 'Welcome to Our Website', emailContent);
  } catch (error) {
    console.error('Error sending email:', error.message);
    throw new Error('Error sending email');
  }
};

