async function log(entry) {
    if (arguments.length > 1) {
        const guild = arguments[0].id;
        console.log(`[GUILD LOG] ${guild} : ${arguments[1]}`);
    } else {
        console.log(`[LOGGER] : ${entry}`);
    }
}

module.exports = { log };
