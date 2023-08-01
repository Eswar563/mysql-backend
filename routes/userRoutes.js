const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const authenticationToken = require('../middlewares/middlewares')

//user-routes
router.post("/register", userController.createUser);
router.post("/login", userController.loginUser);
router.get("/profile", authenticationToken.authenticateToken, userController.profile);
router.put("/updateprofile/:id/",authenticationToken.authenticateToken, userController.updateProfile);



module.exports = router;
