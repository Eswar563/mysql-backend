// const bcrypt = require("bcrypt");
// const jwt = require("jsonwebtoken")

const db = require("../db");
const express = require("express");
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);

 //users
 exports.users = async (request, response) => {
    const getUsersQuery = `
      SELECT
        *
      FROM
        user
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
        user
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
        user
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
      username,
      name,
      password,
      gender,
      location,
    } = userDetails;
    const addUserQuery = `
      INSERT INTO
        user (username, name, password, gender, location)
      VALUES
        (
          '${username}',
          '${name}',
          '${password}',
          '${gender}',
          '${location}'
        );`;
  
    db.query(addUserQuery, (error, results) => {
      if (error) {
        console.error('Error adding user to MySQL:', error);
        return response.status(500).json({ message: 'Error adding user' });
      }
  
      const userId = results.insertId;
      response.send({ userId: userId });
    });
  };

 //updateUser
 exports.updateUser = async(request, response) => {
  const { id } = request.params;
  const userDetails = request.body;
  const {
    username,
    name,
    password,
    gender,
    location,
  } = userDetails;
  const updateUserQuery = `
    UPDATE user
    SET
      username='${username}',
      name='${name}',
      password='${password}',
      gender='${gender}',
      location='${location}'
    WHERE
      id = ${id};`;

  db.query(updateUserQuery, (error, results) => {
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

//deleteAllUsers
exports.deleteAllUsers = async (request, response) => {
  const deleteAllUsersQuery = `
    DELETE FROM user;`;

  db.query(deleteAllUsersQuery, (error, results) => {
    if (error) {
      console.error('Error deleting users from MySQL:', error);
      return response.status(500).json({ message: 'Error deleting users' });
    }

    const deletedRowCount = results.affectedRows;
    response.send(`${deletedRowCount} Users Deleted Successfully`);
  });
};
