const mysql2 = require("mysql2/promise");
const MONGOOSE = require("mongoose");
const asyncWrapper = require("../utils/asyncWrapper");

const pool = mysql2.createPool({
  host: "127.0.0.1",
  user: "root",
  password: process.env.DB_PASSWORD,
  database: "clinic_project",
});

const mongooseConnect = () => {
  return MONGOOSE.connect(
    "mongodb+srv://heradurajones07:rjwagnamagdota@jonesmongo.u1czhvy.mongodb.net/clinic_project?retryWrites=true&w=majority&appName=JonesMongo"
  ).then(console.log("connected to mongodb"));
};
module.exports = { pool, mongooseConnect };
