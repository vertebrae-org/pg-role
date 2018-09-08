const assert = require('assert');
const {db,select,query} = require('..');

const role = 'test';
const schema = 'test';
const testUserA = 'a@test.com';

describe('SCHEMA', function () {

    before(async function () {
        await query(`
            DROP SCHEMA IF EXISTS public cascade;
            DROP SCHEMA IF EXISTS test cascade;
            CREATE SCHEMA public;
            CREATE SCHEMA test;
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
            CREATE TABLE test.employees (
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

    it('should select public.employees', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}');
        `);
        const {rows} = await select({
            model: 'employees'
        });
        assert.equal(testUserA, rows[0] && rows[0].email);
    });

    it('should select test.employees', async function () {
        await query(`
            INSERT INTO test.employees (email) values
                ('${testUserA}');
        `);
        const {rows} = await select({
            schema,
            model: 'employees'
        });
        assert.equal(testUserA, rows[0] && rows[0].email);
    });
});

