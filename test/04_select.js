const assert = require('assert');
const {db,select,query} = require('..');

const role = 'test';
const schema = 'test';
const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';

describe('SELECT', function () {

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
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
    });

    it('should select employees', async function () {
        const {rows} = await select({
            model: 'employees'
        });
        assert.equal(testUserA, rows[0] && rows[0].email);
        assert.equal(testUserB, rows[1] && rows[1].email);
        assert.equal(testUserC, rows[2] && rows[2].email);
    });

    it('should select employee by id', async function () {
        const {rows} = await select({
            model: 'employees',
            id: 1
        });
        assert.equal(testUserA, rows[0] && rows[0].email);
    });

    it('should select employee by email', async function () {
        const {rows} = await select({
            model: 'employees',
            where: {
                email: testUserA
            },
            limit: 1
        });
        assert.equal(testUserA, rows[0] && rows[0].email);
    });

    it('should select employees like "@test.com"', async function () {
        const {rows} = await select({
            model: 'employees',
            where: {
                $like: {
                    email: '%@test.com'
                }
            }
        });
        assert.equal(rows.length, 3);
        assert.equal(testUserA, rows[0] && rows[0].email);
        assert.equal(testUserB, rows[0] && rows[1].email);
        assert.equal(testUserC, rows[0] && rows[2].email);
    });

    it('should select employees with id < 2', async function () {
        const {rows} = await select({
            model: 'employees',
            where: {
                $lt: {
                    id: 2
                }
            }
        });
        assert.equal(rows.length, 1);
        assert.equal(testUserA, rows[0] && rows[0].email);
    });

    it('should select employees with id > 2', async function () {
        const {rows} = await select({
            model: 'employees',
            where: {
                $gt: {
                    id: 2
                }
            }
        });
        assert.equal(rows.length, 1);
        assert.equal(testUserC, rows[0] && rows[0].email);
    });

    it('should select employees with id <= 2', async function () {
        const {rows} = await select({
            model: 'employees',
            where: {
                $lte: {
                    id: 2
                }
            }
        });
        assert.equal(rows.length, 2);
        assert.equal(testUserA, rows[0] && rows[0].email);
        assert.equal(testUserB, rows[1] && rows[1].email);
    });

    it('should select employees with id >= 2', async function () {
        const {rows} = await select({
            model: 'employees',
            where: {
                $gte: {
                    id: 2
                }
            }
        });
        assert.equal(rows.length, 2);
        assert.equal(testUserB, rows[0] && rows[0].email);
        assert.equal(testUserC, rows[1] && rows[1].email);
    });

    it('should select employees with id != 2', async function () {
        const {rows} = await select({
            model: 'employees',
            where: {
                $ne: {
                    id: 2
                }
            }
        });
        assert.equal(rows.length, 2);
        assert.equal(testUserA, rows[0] && rows[0].email);
        assert.equal(testUserC, rows[1] && rows[1].email);
    });

});

