const dbConfig = require("../../db.config.js");

const Sequelize = require("sequelize");
const sequelize = new Sequelize(dbConfig);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.Client = require("./clients.js")(sequelize, Sequelize);
db.Boot = require("./boot.js")(sequelize, Sequelize);

module.exports = db;
