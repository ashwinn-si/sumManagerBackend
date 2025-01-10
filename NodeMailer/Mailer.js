const nodeMailer = require("nodemailer");
const transport = require("nodemailer/lib/mailer");
require("dotenv").config();
const Mailtransporter = nodeMailer.createTransport({
    secure: true,
    post:456,
    host:"smtp.gmail.com",
    auth:{
        user : process.env.mailID,
        pass:process.env.mailPass
    }
})

function sendMailHelper(to , OTP){
    const boilerTemplate = `
        <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
            <h2 style="color: #2a7ae2;">Welcome to Code Manager</h2>
            <p>Your verification code is:</p>
            <p style="font-size: 1.5em; font-weight: bold; color: #ff5733;">${OTP}</p>
        </div>
    `;

    Mailtransporter.sendMail({
        to: to,
        subject: "OTP Verification Code",
        html: boilerTemplate, 
    });
}
module.exports = sendMailHelper;
