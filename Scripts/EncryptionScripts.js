const bcrypt = require("bcrypt");
require("dotenv").config();

async function EncrptyPasswordHelper(password) {
    const hashPassword = await bcrypt.hash(password, parseInt(process.env.saltValue));
    return hashPassword;
}



module.exports = EncrptyPasswordHelper;