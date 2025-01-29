const mongoose = require('mongoose');

const SnippetSchema = mongoose.Schema({
    image: {
        type: String,
        default:""
    },
    code :{
        type: String,
        default:""
    },
    language : {
        type : String,
        default : "text"
    }
});

const QuestionSchema = mongoose.Schema({
    CreateDate:{
      type: Date,
      default: Date.now
    },
    Date:{
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
    },
    Snippet : {
        type : SnippetSchema,
        default : {
            image : "",
            code : "",
        }
    },
    Note : {
        type : String,
        default : ""
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