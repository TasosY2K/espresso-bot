module.exports = (sequelize, Sequelize) => {
    const Boot = sequelize.define("boot", {
        identifier: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        ip: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        port: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        duration: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    });
    return Boot;
};
