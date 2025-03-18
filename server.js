const dotenv = require("dotenv").config();
const express = require("express");
const cors = require("cors");

const database = require("./config/db");
const app = express();

//Connect to the DB
database();

//Middlewares
app.use(express.json());
app.use(cors());

//path middlewares
app.use("/api/users/", require("./routes/user-route.js"));
app.use("/api/posts/", require("./routes/post-route.js"));
app.use("/api/comments/", require("./routes/comment-route.js"));

const PORT = process.env.PORT || 5000;
app.listen(process.env.PORT, () => {
    console.log(`App listening on port ${PORT}`)
})
