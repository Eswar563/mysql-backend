const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin");
const authenticationToken = require('../middlewares/middlewares')
console.log('authenticationToken>>>>>>>', authenticationToken)

//admin-routes
router.post("/createAdmin", admin.createAdmin)
router.post("/adminLogin", admin.adminLogin)
router.post("/adduser", authenticationToken.authenticateToken, admin.addUser);
router.put("/updateuser/:id/", authenticationToken.authenticateToken,  admin.updateUser)
router.get("/users",authenticationToken.authenticateToken,  admin.users);
router.get("/user/:id/", authenticationToken.authenticateToken, admin.user);
router.delete("/deleteuser/:id/", authenticationToken.authenticateToken, admin.deleteUser);
router.delete("/deleteAllUsers",authenticationToken.authenticateToken, admin.deleteAllUsers);
module.exports = router;
