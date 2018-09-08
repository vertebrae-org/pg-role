const assert = require('assert');
const {select,query} = require('..');

const role = 'test';
const schema = 'test';
const testUserA = 'a@test.com';

describe('QUERY', function () {
    it('should run query', async function () {
        const result = await query(`
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
            INSERT INTO employees (email) values ('${testUserA}');
            SELECT email from employees;
        `);
        const {rowCount, rows} = result.pop();
        assert.equal(rowCount, 1);
        assert.equal(testUserA, rows[0] && rows[0].email);
    });
});

