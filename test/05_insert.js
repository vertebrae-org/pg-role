const assert = require('assert');
const {db,insert,query} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';

describe('INSERT', function () {

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

    it('should insert employees', async function () {
        const a = await insert({
            model: 'employees',
            set: {
                email: testUserA
            }
        });
        const b = await insert({
            model: 'employees',
            set: {
                email: testUserB
            }
        });
        const c = await insert({
            model: 'employees',
            set: {
                email: testUserC
            }
        });
        assert(testUserA, a.email);
        assert(testUserB, b.email);
        assert(testUserC, c.email);
        const {rows} = await query(`
            select email from employees;
        `);
        assert(testUserA, rows[0] && rows[0].email);
        assert(testUserB, rows[1] && rows[1].email);
        assert(testUserC, rows[2] && rows[2].email);
    });

    it('should fail to insert due to unique constraint', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}');
        `);
        const didFail = await insert({
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

