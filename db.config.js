require("dotenv").config();

module.exports = {
    dialect: "sqlite",
    storage: process.env.DB_PATH,
};
