const bcrypt = require("bcrypt");
require("dotenv").config();

async  function ComparePasswordHelper(Userpassword , Dbpassword) {
    const res  = await bcrypt.compare(Userpassword, Dbpassword);
    return res;
}

module.exports = ComparePasswordHelper;