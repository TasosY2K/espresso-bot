module.exports = (sequelize, Sequelize) => {
    const Boot = sequelize.define("boot", {
        tracknum: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        identifier: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        ip: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        port: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        duration: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        startTime: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        endTime: {
            type: Sequelize.DATE,
            allowNull: false,
        },
    });
    return Boot;
};
