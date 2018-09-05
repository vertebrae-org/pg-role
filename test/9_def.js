const assert = require('assert');
const {db,select,def,query} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';

describe('DEF', function () {

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

    it('should get table definition', async function () {
        const {rows} = await def({
            database: 'postgres',
            model: 'employees'
        });
        assert(rows.length > 0);
    });


});

