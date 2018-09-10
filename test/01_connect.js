const assert = require('assert');
const {db} = require('..');

describe('CONNECT', function () {

    it('should connect to database with default pool', async function () {
        await db.connect();
        db.release();
    });

    it('should connect to database with test pool', async function () {
        await db.connect(['test']);
        db.release();
    });

});

