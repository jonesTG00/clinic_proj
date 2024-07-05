require("dotenv").config();
const express = require("express");
const http = require("http");
const MONGOOSE = require("mongoose");
const cors = require("cors");

const cookieparser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const account = require("./src/routes/accountRoute");
const error = require("./src/middleware/error");
const dashboardSocket = require("./src/controllers/socket-dashboard");
const { authenticate } = require("./src/middleware/authenticate");
const { mongooseConnect } = require("./src/db/db");
const loggedInFunctions = require("./src/routes/loggedInOperations");
const verifyEmailOperations = require("./src/routes/verifyEmailOperations");
const { verifyEmail } = require("./src/controllers/userController");
// const { EventEmitterAsyncResource } = require("stream");

const app = express();

app.use(cookieparser());
app.use(cors());
app.use(express.json());

const httpServer = http.createServer(app);

app.use(account);
app.use(loggedInFunctions);
app.use(error);
dashboardSocket(httpServer);

// MONGOOSE.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useCreateIndex: true,
//   useFindAndModify: false,
//   useUnifiedTopology: true,
// });

httpServer.listen(3001, async () => {
  try {
    console.log("Server running");
    const date = new Date();
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    console.log(`${hours}:${minutes}:${seconds}`);
    await mongooseConnect();
  } catch (error) {
    console.log(error);
  }
});
