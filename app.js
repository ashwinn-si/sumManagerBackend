const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const  EncryptPasswordHelper = require("./Scripts/EncryptionScripts");
const ComparePasswordHelper = require("./Scripts/CompareScripts");
const userLoginModel = require("./models/UserLogin");
const userDetailsModel = require("./models/UserDetails");
const ImageModel = require("./models/ImageStorage");
const sendMailHelper = require("./NodeMailer/Mailer");
const generateOTP = require("./Scripts/OTPGenerator");
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.use(express.json({ limit: '100mb', extended: true }));
app.use(express.urlencoded({ limit: '100mb', extended: true, parameterLimit: 50000 }));

const mongooseUrl = process.env.MONGODB_URL;

app.get("/", async (req, res) => {
    res.send("Server is running!");
});


//after verfication is completed we are updating the hash value
app.post("/create-user", async (req, res) => {
    try{
        const hashPassword = await EncryptPasswordHelper(req.body.password);

        const newUserDetails = new userDetailsModel({
            email : req.body.email,
        })

        await userLoginModel.findOneAndUpdate({
            email : req.body.email
        },{
            password: hashPassword,
        })
        await newUserDetails.save();
        res.status(200).json({message : "user created successfully"});
    }
    catch(e) {
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
        console.log(req.body.email);
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
            await sendMailHelper(req.body.email, OTP )
            res.status(200).json({message : "user created successfully"});
        }else{
            res.status(404).json({message : "user already exist"});
        }
    }catch (e){
        res.status(401).json({message : "Internal server error"});
    }


})

//router to verify the otp generated
app.post("/create-user/otp-verification", async (req, res) => {
    try{
        const data = await userLoginModel.findOne({
            email : req.body.email,
        })
        if(data.OTP === parseInt(req.body.otp)){
            res.status(200).json({message : "OTP Correct"});
        }else{
            res.status(404).json({message : "OTP incorrect"});
        }
    }catch(e) {
        res.status(401).json({message: "Internal server error"});
    }
})

//router to login
app.post("/login", async (req, res) => {
    try{
        const data = await userLoginModel.find({email : req.body.email});
        if(data.length > 0){
            const result = await ComparePasswordHelper(req.body.password, data[0].password);
            const hash = await EncryptPasswordHelper(req.body.password);
            if(result){
                res.status(200).json({
                    message : "User logged in successfully"
                })
            }else{
                res.status(404).json({message : "password incorrect"});
            }
        }else{
            res.status(406).json({message : "User doesn't exist"});
        }
    }catch (e){
        res.status(401).json({message : "Internal server error"});
    }

})

//router for forgot password
app.get("/:email/forgot-password", async (req, res) => {
    try{
        const user = await userLoginModel.findOne({email : req.params.email})
        if(user.length > 0){
            const OTP = generateOTP();
            await userLoginModel.findOneAndUpdate({email : req.params.email , OTP})
            await sendMailHelper(req.body.email, OTP)
            res.status(200).json({message : "otp generated successfully"});
        }else{
            res.status(404).json({message : "user does not exist"});
        }
    }catch (e){
        res.status(401).json({message : "Internal server error"});
    }
})

app.post("/:email/forgot-password/reset", async (req, res) => {
    const hashPassword = await EncryptPasswordHelper(req.body.password);
    await userLoginModel.findOneAndUpdate({
        email : req.body.email
    },{
        password: hashPassword,
    })
    res.status(200).json({message : "reset"});
})

//router to get all folders in the database and show in dashboard
app.get('/:email/folder-dashboard', async (req, res) => {
    try {
        const user = await userDetailsModel.findOne({ email: req.params.email });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        res.json({ allFolders: user.AllFolders });
    } catch (err) {
        console.error("Error fetching user data:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

//router to create a folder
app.post("/:email/folder/create",async (req, res) => {
    try{
        const data = await userDetailsModel.findOne({ email : req.params.email });
        const allFolders = data.AllFolders;
        const names = allFolders.map((element) =>{
           return element.FolderName
        })
        if(names.includes(req.body.folder_name)){
            res.status(409).json({message : "folder exsist"})
        }else{
            allFolders.push({FolderName : req.body.folder_name})
            await data.save();
            res.status(200).json({message : "folder created"})
        }
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

//router to get the images details in the folder
app.post("/:email/:folder_name/image-details",async (req,res) =>{
    try{
        const data = await userDetailsModel.findOne({email : req.params.email})
        const allQuestions = data.AllFolders.filter((element) =>{
            return element.FolderName === req.params.folder_name;
        })
        const imageData = allQuestions[0].Questions.map(element =>{
            return element.Snippet.image
        })
        res.json({data : imageData})
    }catch (e) {
        res.status(401).json({message : "Internal server error"});
    }
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
        data.AllFolders[folderIndex].Questions = req.body.allQuestions;

        await data.save();
        res.status(200).json({ message: "Folder updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});

//forgotPassword Route
app.post("/:email/forgot-password", async (req, res) => {
    try {
        const data = await userLoginModel.find({ email: req.params.email });

        if (data.length > 0) {
            return res.status(200).json({ message: "email already exist" }); // Return after sending response
        }

        return res.status(404).json({ message: "email does not exist" }); // Return after sending response
    } catch (e) {
        return res.status(500).json({ message: "Internal server error" }); // Return after sending response
    }
});

app.post("/:email/forgot-password/generateOTP", async (req, res) => {
    try {
        const data = await userLoginModel.findOne({email: req.params.email});
        data.OTP = generateOTP();
        await data.save();
        await sendMailHelper(req.params.email, data.OTP)
        res.status(200).json({message : "email generated successfully"});
    }catch(e){
        res.status(500).json({message:"Internal server error"});
    }
})

//snippet image router
app.post("/store-image", upload.single("image"), async (req, res) => {
    const newImage = new ImageModel(
        {
            image: req.file
                ? { data: req.file.buffer, contentType: req.file.mimetype }
                : undefined,
        }
    );
    await newImage.save().then((data)=>{
        res.status(200).json({message : data._id});
    })
})

app.post("/store-image/:id", async (req, res) => {
    const imageId = req.params.id;// Get the image ID from the URL
    try {
        // Fetch the image by its ID
        const imageData = await ImageModel.findById(imageId);
        //converting to based 64
        let imageBase64 = null;
        if(imageData.image && imageData.image.data){
            imageBase64 = imageData.image.data.toString('base64');
        }
        res.json({image:  imageBase64});
    } catch (err) {
        console.error(err);
        res.status(500).send('Error retrieving image');
    }
})

app.delete("/store-image/delete/:id",async (req,res) =>{
    try{
        await ImageModel.findByIdAndDelete(req.params.id);
        res.status(200).json({message : "Image deleted successfully"});
    }catch(e){
        res.status(404).json({message : "Internal server error"});
    }

})

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
