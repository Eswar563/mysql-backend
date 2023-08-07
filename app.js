const express = require("express");
const db = require("./db"); 
const app = express();
const cors = require("cors")
app.use(cors())
const userRoutes = require("./routes/userRoutes");
const adminRoutes = require("./routes/adminRoutes");
const blogRoutes = require("./routes/blogRoutes")


app.use(express.json());
app.use("/", userRoutes, adminRoutes, blogRoutes);

const initializeDBAndServer = () => {
  db.connect((err) => {
    if (err) {
      console.error("DB Error:", err.message);
      process.exit(1);
    } else {
      console.log("Connected to MySQL database.");
      app.listen(3000, () => {
        console.log("Server Running at http://localhost:3000/");
      });
    }
  });
};

initializeDBAndServer();
