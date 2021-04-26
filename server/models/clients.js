module.exports = (sequelize, Sequelize) => {
    const Client = sequelize.define("client", {
        tag: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        identifier: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        token: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        ipAddress: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        lastLogin: {
            type: Sequelize.DATE,
            allowNull: false,
        },
        country: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        countryCode: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        region: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        regionCode: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        city: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        lat: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        lon: {
            type: Sequelize.FLOAT,
            allowNull: false,
        },
        isp: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        hostname: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        platform: {
            type: Sequelize.STRING,
            allowNull: true,
        },
        arch: {
            type: Sequelize.STRING,
            allowNull: true,
        },
    });
    return Client;
};
