module.exports = (sequelize, Sequelize) => {
    const Boot = sequelize.define("boot", {
        tracknum: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        identifier: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        ip: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        port: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        duration: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        startTime: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        endTime: {
            type: Sequelize.DATE,
            allowNull: true,
        },
        replies: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
    });
    return Boot;
};
