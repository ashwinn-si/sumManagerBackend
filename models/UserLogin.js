const mongoose = require('mongoose');
require('dotenv').config();

const Schema = new mongoose.Schema({
    email : String,
    password : String,
    OTP : Number,
})

const userLoginModel = mongoose.model("UserLogin", Schema);

module.exports =  userLoginModel;