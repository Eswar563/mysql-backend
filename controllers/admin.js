const bcrypt = require("bcrypt");
const db = require("../db");
const express = require("express");
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);
const queryUtilities = require("../queryUtilities/queryUtilities")
const generateJwtToken = require("../generateJwtToken/generateJwtToken")

//createAdmin
exports.createAdmin = async (request, response) => {
  const fields = {
    user_id: 'user_id',
    full_name: 'full_name',
    email_address: 'email_address',
    password: 'password',
    address: 'address',
    phone_number: 'phone_number',
    gender: 'gender',
    is_admin: 'is_admin',
  };

  const { full_name, email_address, password, address, phone_number, gender, is_admin } = request.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const rows = await queryUtilities.findUserByName("users", "full_name", full_name);

    if (!rows) {
      const userData = {
        full_name,
        email_address,
        hashedPassword,
        address,
        phone_number,
        gender,
        is_admin, 
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

//adminLogin
exports.adminLogin = async (request, response) => {
  const { email_address, password } = request.body;
  try {
    const dbUser = await queryUtilities.findUserByName("users", "email_address", email_address);
    if (!dbUser) {
      return response.status(400).send("Invalid User");
    }
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched) {
      // Check if the user is an admin
      if (dbUser.is_admin) {
        await queryUtilities.updateLoggedInStatus(email_address);
        const payload = {
          email_address: email_address,
          is_admin: dbUser.is_admin, 
        };
        const jwtToken = generateJwtToken.generateJwtToken(payload, "MY_SECRET_TOKEN");
        response.send({ jwtToken });
      } else {
        response.status(403).send("Unauthorized: Not an admin");
      }
    } else {
      response.status(400).send("Invalid Password");
    }
  } catch (error) {
    console.error("DB Error:", error.message);
    response.status(500).send("Database error");
  }
};

//users
exports.users = async (request, response) => {
  const getUsersQuery = `
    SELECT
      *
    FROM
      users
    ORDER BY
      id;`;

  db.query(getUsersQuery, (error, results) => {
    if (error) {
      console.error('Error fetching users from MySQL:', error);
      return response.status(500).json({ message: 'Error fetching users' });
    }

    response.send(results);
  });
};

//user
exports.user = async (request, response) => {
  const { id } = request.params; 
  const getUserQuery = `
    SELECT
      *
    FROM
      users
    WHERE
      id = ?;`;


  db.query(getUserQuery, [id], (error, results) => {
    if (error) {
      console.error('Error fetching user from MySQL:', error); 
      return response.status(500).json({ message: 'Error fetching user' }); 
    }

    if (results.length === 0) {
      return response.status(404).json({ message: 'User not found' });
    }

    const user = results[0]; 
    response.send(user);
  });
};

//deleteUser
exports.deleteUser = async (request, response) => {
  const { id } = request.params;
  const deleteUserQuery = `
    DELETE FROM
      users
    WHERE
      id = ?;`; 

  db.query(deleteUserQuery, [id], (error, results) => {
    if (error) {
      console.error('Error deleting book from MySQL:', error);
      return response.status(500).json({ message: 'Error deleting user' });
    }

    if (results.affectedRows === 0) {
      return response.status(404).json({ message: 'User not found' });
    }

    response.send("User Deleted Successfully");
  });
};


//addUser

exports.addUser = async (request, response) => {
  const userDetails = request.body;
  const {
    user_id,
    full_name,
    email_address,
    password,
    address,
    phone_number,
    gender,
  } = userDetails;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const addUserQuery = `
      INSERT INTO users (user_id, full_name, email_address, password, address, phone_number, gender)
      VALUES (?, ?, ?, ?, ?, ?, ?);`;

    const values = [user_id, full_name, email_address, hashedPassword, address, phone_number, gender];

    db.query(addUserQuery, values, (error, results) => {
      if (error) {
        console.error('Error adding user to MySQL:', error);
        return response.status(500).json({ message: 'Error adding user' });
      }

      const userId = results.insertId;
      response.send({ userId: userId });
    });
  } catch (error) {
    console.error('Error hashing password:', error);
    return response.status(500).json({ message: 'Error hashing password' });
  }
};



//updateUser

exports.updateUser = async (request, response) => {
const { id } = request.params;
const userDetails = request.body;
const {
  user_id,
  full_name,
  email_address,
  password,
  address,
  phone_number,
  gender,
} = userDetails;

try {
  const hashedPassword = await bcrypt.hash(password, 10);

  const updateUserQuery = `
    UPDATE users
    SET
      user_id = ?,
      full_name = ?,
      email_address = ?,
      password = ?,
      address = ?,
      phone_number = ?,
      gender = ?
    WHERE
      id = ?;`;

  const values = [user_id, full_name, email_address, hashedPassword, address, phone_number, gender, id];

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
} catch (error) {
  console.error('Error hashing password:', error);
  return response.status(500).json({ message: 'Error hashing password' });
}
};


//deleteAllUsers
exports.deleteAllUsers = async (request, response) => {
const deleteAllUsersQuery = `
  DELETE FROM users;`;

db.query(deleteAllUsersQuery, (error, results) => {
  if (error) {
    console.error('Error deleting users from MySQL:', error);
    return response.status(500).json({ message: 'Error deleting users' });
  }

  const deletedRowCount = results.affectedRows;
  response.send(`${deletedRowCount} Users Deleted Successfully`);
});
};
