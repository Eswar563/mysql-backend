const express = require("express");
const router = express.Router();
const admin = require("../controllers/admin");
// const authenticationToken = require('../middlewares/middlewares')

//admin-routes
router.get("/users", admin.users);
router.get("/user/:id/", admin.user);
router.delete("/deleteuser/:id/", admin.deleteUser);
router.post("/adduser", admin.addUser);
router.put("/updateuser/:id/", admin.updateUser)

router.delete("/deleteAllUsers", admin.deleteAllUsers);



module.exports = router;
