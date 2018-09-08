const assert = require('assert');
const {db,select,Model,query,env} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';
const now = new Date().toUTCString();

describe('MODEL', function () {

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

    it('should create and find employee A', async function () {
        const Employee = new Model('employees');
        await Employee.create({
            email: testUserA
        });
        const {rows} = await query(`
            select email from employees where email = '${testUserA}';
        `);
        assert.equal(rows.length, 1);
        assert.equal(testUserA, rows[0].email);
    });

    it('should find all employees', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
        const Employee = new Model('employees');
        const {rows} = await Employee.find();
        assert.equal(rows.length, 3);
        assert.equal(testUserA, rows[0].email);
        assert.equal(testUserB, rows[1].email);
        assert.equal(testUserC, rows[2].email);
    });

    it('should find employee by email', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
        const Employee = new Model('employees');
        const {rows} = await Employee.find({
            where: {
                email: testUserB
            }
        });
        assert.equal(rows.length, 1);
        assert.equal(testUserB, rows[0].email);
    });

    it('should findOne employee by id', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
        const Employee = new Model('employees');
        const {rows} = await Employee.findOne(3);
        assert.equal(rows.length, 1);
        assert.equal(testUserC, rows[0].email);
    });

    it('should update employee A', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}');
        `);
        const Employee = new Model('employees');
        await Employee.update({
            where: {email: testUserA},
            set: {email: testUserB}
        });
        const {rows} = await query(`
            select email from employees where email = '${testUserB}';
        `);
        assert.equal(rows.length, 1);
        assert.equal(testUserB, rows[0].email);
    });

});

