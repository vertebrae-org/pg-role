const assert = require('assert');
const {db,select,Model,query,env} = require('..');

const testUserA = 'a@test.com';
const testUserB = 'b@test.com';
const testUserC = 'c@test.com';
const now = new Date().toISOString();

describe('MODEL', function () {

    beforeEach(async function () {
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

    it('should create employee', async function () {
        const Employee = new Model('employees');
        const employee = await Employee.create({email: testUserA});
        assert.equal(testUserA, employee.get('email'));
    });

    it('should select all employees', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
        const Employee = new Model('employees');
        const {rows} = await Employee.select();
        assert.equal(rows.length, 3);
        assert.equal(testUserA, rows[0].email);
        assert.equal(testUserB, rows[1].email);
        assert.equal(testUserC, rows[2].email);
    });

    it('should select employees by email', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
        const Employee = new Model('employees');
        const {rows} = await Employee.select({
            where: {email: testUserB}
        });
        assert.equal(rows.length, 1);
        assert.equal(testUserB, rows[0].email);
    });

    it('should get employee instance by id', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
        const Employee = new Model('employees');
        const employee = await Employee.find(3);
        assert.equal(testUserC, employee.get('email'));
    });

    it('should get employee instance by email', async function () {
        await query(`
            INSERT INTO employees (email) values
                ('${testUserA}'),
                ('${testUserB}'),
                ('${testUserC}');
        `);
        const Employee = new Model('employees');
        const employee = await Employee.find({
            email: testUserB
        });
        assert.equal(testUserB, employee.get('email'));
    });

});

describe('MODEL INSTANCE', function () {

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

    it('should create an instance of employee', async function () {
        const Employee = new Model('employees');
        const employee = await Employee.create({
            email: testUserA
        });
        assert.equal(testUserA, await employee.get('email'));
    });

    it('should update an instance of employee', async function () {
        const Employee = new Model('employees');
        const employee = await Employee.create({
            email: testUserA
        });
        assert.equal(testUserA, await employee.get('email'));
        await employee.update({
            email: testUserB
        });
        assert.equal(testUserB, await employee.get('email'));
    });

    it('should delete an instance of employee', async function () {
        const Employee = new Model('employees');
        const employee = await Employee.create({
            email: testUserA
        });
        assert.equal(testUserA, await employee.get('email'));
        await employee.delete();
        assert.notEqual(null, await employee.get('deleted_at'));
    });

    it('should restore an instance of employee', async function () {
        const Employee = new Model('employees');
        const employee = await Employee.create({
            email: testUserA
        });
        assert.equal(testUserA, await employee.get('email'));
        await employee.delete();
        assert.notEqual(null, await employee.get('deleted_at'));
        await employee.restore();
        assert.equal(null, await employee.get('deleted_at'));
    });

    it('should restore an instance of test.employee', async function () {
        const Employee = new Model('employees', {
            pool: 'test'
        });
        const employee = await Employee.create({
            email: testUserA
        });
        assert.equal(testUserA, await employee.get('email'));
        await employee.delete();
        assert.notEqual(null, await employee.get('deleted_at'));
        await employee.restore();
        assert.equal(null, await employee.get('deleted_at'));
    });

});

