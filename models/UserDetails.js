const mongoose = require('mongoose');
const userLoginSchema = require("./UserLogin");

const QuestionSchema = mongoose.Schema({
    date:{
        type: Date,
        default: Date.now
    },
    QuestionNumber : Number,
    QuestionName : String,
    Type : String,
    Status : {
        type: Boolean, // true -> solved | false -> not solved
        default : false
    },
    Revise : {
        type : Boolean,// true -> need to revise | false -> no need to revise
        default : false
    }
});

const FolderSchema = mongoose.Schema({
    FolderName: String,
    Questions :{
        type : [QuestionSchema],
        default : []
    }
});

const Schema = new mongoose.Schema({
    email: String,
    AllFolders: {
        type: [FolderSchema],
        default : []
    }
})


const userDetailsModel = mongoose.model('UserDetails', Schema);

module.exports = userDetailsModel;