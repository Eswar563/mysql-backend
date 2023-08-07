const express = require("express");
const router = express.Router();
const blogController = require("../controllers/blog");
// const authenticationToken = require('../middlewares/middlewares')

router.post("/createblog", blogController.createBlog);
router.get("/getAllBlogs", blogController.getAllBlogs)
router.get("/getblog/:postId", blogController.getBlog)
router.put("/updateblog/:postId", blogController.updateBlog)
router.delete('/deleteblog/:postId', blogController.deleteBlog)
router.delete("/deleteAllBlogs", blogController.deleteAllBlogs)
module.exports = router;