const crypto = require('crypto');

exports.generateApiKey = (type = 'live') => {
    const prefix = type === 'test' ? 'gv_test_' : 'gv_live_';
    const random = crypto.randomBytes(24).toString('hex');
    return prefix + random;
};
