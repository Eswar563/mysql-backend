const jwt = require("jsonwebtoken")

exports.generateJwtToken = (payload, secret) => {
    return jwt.sign(payload, secret);
};

