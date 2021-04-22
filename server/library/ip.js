const axios = require("axios");

exports.info = async (ipAddress) => {
    return await axios.get("http://ip-api.com/json/" + ipAddress);
};

exports.validate = (ipAddress) => {
    if (
        /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(
            ipAddress
        )
    ) {
        return true;
    }
    return false;
};
