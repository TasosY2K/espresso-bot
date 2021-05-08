const express = require("express");
const ipfilter = require("ipfilter");
const path = require("path");
const filewalker = require("../library/walk.js");
const blockedIps = require("../../" + process.env.IP_BLACKLIST_PATH);
const agent = require("./middleware/agent.js");

const application = express();

application.use(express.json());
application.use(ipfilter(blockedIps.addresses));
application.use(express.static(path.join(__dirname, "public")));
application.use(agent);

const init = async (client, secret) => {
    const routes = await filewalker.walk(`${__dirname}/routes/`);

    routes.forEach((route) => {
        const time = new Date().getMilliseconds();
        require(route.path)(application, client, secret);
        console.log(
            `[ROUTE] loaded route ${route.name} in ${
                new Date().getMilliseconds() - time
            }ms`
        );
    });

    application.listen(process.env.API_PORT, () => {
        console.log("[PANEL] listening on port " + process.env.API_PORT);
    });
};

module.exports = { init };
