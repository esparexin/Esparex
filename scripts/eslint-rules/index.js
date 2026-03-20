// eslint-rules/index.js
module.exports = {
    rules: {
        "no-immutable-field-updates": require("./no-immutable-field-updates"),
        "no-status-mutation-outside-status-mutation-service": require("./no-status-mutation-outside-status-mutation-service"),
    },
};
