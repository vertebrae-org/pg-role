const assert = require('assert');
const {db,select,remove,query} = require('..');

const testUserA = 'a@test.com';

describe('DELETE', function () {

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
            INSERT INTO employees (email) values
                ('${testUserA}');
        `);
    });

    it('should delete employee A', async function () {
        const a = await remove({
            model: 'employees',
            where: { email: testUserA }
        });
        const {rows} = await query(`
            select email from employees where email = '${testUserA}';
        `);
        assert.equal(rows.length, 1);
        assert.equal(testUserA, a[0].email);
        assert.notEqual(null, a[0].deleted_at);
    });

});

