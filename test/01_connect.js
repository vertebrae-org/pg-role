const assert = require('assert');
const {db} = require('..');

describe('CONNECT', function () {

    it('should connect to database as default user', async function () {
        await db.connect();
        db.release();
    });

    it('should connect to database as test user', async function () {
        await db.connect(['test']);
        db.release();
    });

});

