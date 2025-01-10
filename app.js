const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const  EncryptPasswordHelper = require("./Scripts/EncryptionScripts");
const ComparePasswordHelper = require("./Scripts/CompareScripts");
const userLoginModel = require("./models/UserLogin");
const userDetailsModel = require("./models/UserDetails");
const sendMailHelper = require("./NodeMailer/Mailer");
const generateOTP = require("./Scripts/OTPGenerator");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

const mongooseUrl = process.env.MONGODB_URL;

app.get("/", async (req, res) => {
    res.send("Server is running!");
});


//after verfication is completed we are updating the hash value
app.post("/create-user", async (req, res) => {
    try{
        const hashPassword = await EncryptPasswordHelper(req.body.password);

        const user = await userLoginModel.find({
            email : req.body.email,
        })
        user.password = hashPassword;
        const newUserDetails = new userDetailsModel({
            email : req.body.email,
        })

        await user.save();
        await newUserDetails.save();
        res.status(200).json({message : "user created successfully"});
    }
    catch {
        res.status(401).json({message : "Internal server error"});
    }

})

//router verification
//during verification we are creating a user
app.post('/create-user/otp-generation', async (req, res) => {
    try{
        const users = await userLoginModel.find({
            email : req.body.email,
        })
        if(users.length === 0){
            const OTP = generateOTP();
            const data = {
                email : req.body.email,
                password : req.body.password,
                OTP : OTP
            };
            const newUser = new userLoginModel(data);
            await newUser.save();
            //need to change the mail id accordingly
            await sendMailHelper("siashwin2005@gmail.com", OTP )
            res.status(200).json({message : "user created successfully"});
        }else{
            res.status(401).json({message : "user already exist"});
        }
    }catch (e){
        res.status(401).json({message : "Internal server error"});
    }


})

//router to verify the otp generated
app.post("/create-user/otp-verification", async (req, res) => {
    const data = await userLoginModel.findOne({
        email : req.body.email,
    })
    if(data.OTP === parseInt(req.body.otp)){
        res.status(200).json({message : "OTP Correct"});
    }else{
        res.status(401).json({message : "OTP incorrect"});
    }

})
//router to login
app.post("/login", async (req, res) => {
    try{
        const data = await userLoginModel.find({email : req.body.email});
        if(data.length > 0){
            const result = await ComparePasswordHelper(req.body.password, data[0].password);
            if(result){
                res.status(200).json({
                    message : "User logged in successfully"
                })
            }else{
                res.status(200).json({message : "password incorrect"});
            }

        }else{
            res.status(401).json({message : "User doesn't exist"});
        }
    }catch (e){
        res.status(401).json({message : "Internal server error"});
    }

})

//router to get all folders in the database and show in dashboard
app.get('/:email/folder-dashboard', async (req, res) => {
    const data = await userDetailsModel.findOne({email: req.params.email});
    const allFolders = data.AllFolders;
    res.send(allFolders);
})

//router to create a folder
app.post("/:email/folder/create",async (req, res) => {
    try{
        const data = await userDetailsModel.findOne({ email : req.params.email });
        const allFolders = data.AllFolders;
        allFolders.push({FolderName : req.body.folder_name})
        await data.save();
        res.status(200).json({message : "folder created"})
    }
    catch (e) {
        res.status(401).json({message : "Internal server error"});
    }
})

//router to delete a folder
app.delete("/:email/folder/delete",async (req,res) =>{
    try{
        const data = await userDetailsModel.findOne({email : req.params.email});
        data.AllFolders = data.AllFolders.filter((element) => {
            return element.FolderName !== req.body.folder_name
        });
        await data.save();
        res.status(200).json({message : "folder deleted"});
    }catch(e){
        res.status(404).json({
            message : "Internal server error"
        })
    }

})


//router to get all the question in the folder
app.get("/:email/:folder_name",async (req,res) =>{
    const data = await userDetailsModel.findOne({email : req.params.email})
    const allQuestions = data.AllFolders.filter((element) =>{
        return element.FolderName === req.params.folder_name;
    })
    res.send(allQuestions[0].Questions);
})

//router to update the question in the folder
app.post("/:email/:folder_name/update", async (req, res) => {
    try {
        // Find the user document
        const data = await userDetailsModel.findOne({ email: req.params.email });

        //  Find the folder index by folder name
        const folderIndex = data.AllFolders.findIndex(
            (element) => element.FolderName === req.params.folder_name
        );
        // Create the question object
        data.AllFolders[folderIndex].Questions = req.body.allQuestion;

        await data.save();
        res.status(200).json({ message: "Folder updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});


mongoose
    .connect(mongooseUrl)
    .then(() => {
        console.log("MongoDB connected");
    })


// Start Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}...`);
});
