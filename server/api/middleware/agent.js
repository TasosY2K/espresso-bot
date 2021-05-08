module.exports = (req, res, next) => {
    const agent = req.headers["user-agent"];

    if (agent != "espresso") {
        return res.sendStatus(403);
    }

    next();
};
