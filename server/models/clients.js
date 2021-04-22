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
            type: Sequelize.STRING,
            allowNull: false,
        },
        lon: {
            type: Sequelize.STRING,
            allowNull: false,
        },
        isp: {
            type: Sequelize.STRING,
            allowNull: false,
        },
    });
    return Client;
};
