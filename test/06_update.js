const assert = require('assert');
const {db,update,query} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';

describe('UPDATE', function () {

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
        `);
    });

    it('should update employee A', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}');
        `);
        const a = await update({
            model: 'employees',
            where: {
                email: testUserA
            },
            set: {
                email: testUserB
            }
        });
        assert.equal(testUserB, a.email);
        const {rows} = await query(`
            select email from employees where email = '${testUserB}';
        `);
        assert.equal(rows.length, 1);
        assert.equal(testUserB, rows[0].email);
    });

});

