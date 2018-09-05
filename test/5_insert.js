const assert = require('assert');
const {db,select,insert,query} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';

describe('INSERT', function () {

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
        `);
    });

    it('should insert employees', async function () {
        await insert({
            role: 'test',
            model: 'employees',
            set: {
                email: testUserA
            }
        });
        await insert({
            role: 'test',
            model: 'employees',
            set: {
                email: testUserB
            }
        });
        await insert({
            role: 'test',
            model: 'employees',
            set: {
                email: testUserC
            }
        });
        const employees = await select({
            role: 'test',
            model: 'employees'
        });
        assert(testUserA, employees.rows[0] && employees.rows[0].email);
        assert(testUserB, employees.rows[1] && employees.rows[1].email);
        assert(testUserC, employees.rows[2] && employees.rows[2].email);
    });

    it('should fail to insert due to unique constraint', async function () {
        const didFail = await insert({
            role: 'test',
            model: 'employees',
            set: {
                email: testUserA
            }
        })
        .then(() => {return false;})
        .catch(e => {return true;});
        assert(didFail);
    });
});

