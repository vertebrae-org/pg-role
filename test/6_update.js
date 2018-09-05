const assert = require('assert');
const {db,select,update,query} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';

describe('UPDATE', function () {

    before(async function () {
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
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
    });

    it('should update employee A', async function () {
        const email = 'a' + testUserA
        await update({
            model: 'employees',
            id: 1,
            set: {
                email
            }
        });
        const employee = await select({
            model: 'employees',
            id: 1
        });
        assert.equal(email, employee.rows[0].email);
    });

    it('should update employee B', async function () {
        const email = 'b' + testUserB
        await update({
            model: 'employees',
            id: 2,
            set: {
                email
            }
        });
        const employee = await select({
            model: 'employees',
            id: 2
        });
        assert.equal(email, employee.rows[0].email);
    });

    it('should update employee C', async function () {
        const email = 'c' + testUserC
        await update({
            model: 'employees',
            id: 3,
            set: {
                email
            }
        });
        const employee = await select({
            model: 'employees',
            id: 3
        });
        assert.equal(email, employee.rows[0].email);
    });

});

