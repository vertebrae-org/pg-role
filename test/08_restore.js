const assert = require('assert');
const {db,select,restore,query} = require('..');

const testUserA = 'a@test.com';
const now = new Date().toUTCString();

describe('RESTORE', function () {

    beforeEach(async function () {
        await query(`
            DROP SCHEMA IF EXISTS public cascade;
            CREATE SCHEMA public;
            CREATE TABLE employees (
                id SERIAL,
                email VARCHAR UNIQUE NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                created_by INT,
                updated_at TIMESTAMP,
                updated_by INT,
                deleted_at TIMESTAMP,
                deleted_by INT
            );
            INSERT INTO employees (email, deleted_at) values
                ('${testUserA}', '${now}');
        `);
    });

    it('should restore employee A', async function () {
        await restore({
            model: 'employees',
            where: { email: testUserA }
        });
        const {rows} = await query(`
            select email from employees where email = '${testUserA}' and deleted_at is null;
        `);
        assert.equal(rows.length, 1);
    });

});

