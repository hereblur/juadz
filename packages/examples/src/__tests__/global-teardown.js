const { closeTestServer } = require('./test-setup');

module.exports = async () => {
    await closeTestServer();
};