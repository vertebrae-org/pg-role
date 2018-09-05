const assert = require('assert');
const {db,select,restore,query} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';
const now = new Date().toUTCString();

describe('RESTORE', function () {

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
            INSERT INTO employees (email, deleted_at) values
                ('${testUserA}', '${now}'),
                ('${testUserB}', '${now}'),
                ('${testUserC}', '${now}');
        `);
    });

    it('should restore employee A', async function () {
        await restore({
            model: 'employees',
            id: 1,
        });
        const {rows} = await select({
            id: 1,
            model: 'employees'
        });
        assert.equal(rows.length, 1);
    });

    it('should restore employee B', async function () {
        await restore({
            model: 'employees',
            id: 2,
            set: {
                email: 'b' + testUserB
            }
        });
        const {rows} = await select({
            id: 2,
            model: 'employees'
        });
        assert.equal(rows.length, 1);
    });

    it('should restore employee C', async function () {
        await restore({
            model: 'employees',
            id: 3,
            set: {
                email: 'c' + testUserC
            }
        });
        const {rows} = await select({
            id: 3,
            model: 'employees'
        });
        assert.equal(rows.length, 1);
    });

});

