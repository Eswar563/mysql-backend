const express = require("express");
const jwt = require("jsonwebtoken")
const app = express();
const jsonMiddleware = express.json();
app.use(jsonMiddleware);

exports.authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
      jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
      response.status(401);
      response.send("Invalid JWT Token");
    } else {
      jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
        if (error) {
          response.status(401);
          response.send("Invalid JWT Token");
        } else {
          request.email_address = payload.email_address;
          next();
        }
      });
    }
  };

  