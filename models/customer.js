/** Customer for Lunchly */

const db = require("../db");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
  constructor({
    id,
    firstName,
    lastName,
    phone,
    notes
  }) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.phone = phone;
    this.notes = notes;
  }

  /** find all customers. */

  static async all() {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes
       FROM customers
       ORDER BY last_name, first_name`
    );
    return results.rows.map(c => new Customer(c));
  }

  /** get a customer by ID. */

  static async get(id) {
    const results = await db.query(
      `SELECT id, 
         first_name AS "firstName",  
         last_name AS "lastName", 
         phone, 
         notes 
        FROM customers WHERE id = $1`,
      [id]
    );

    const customer = results.rows[0];

    if (customer === undefined) {
      const err = new Error(`No such customer: ${id}`);
      err.status = 404;
      throw err;
    }

    return new Customer(customer);
  }

  // search for customers
  static async findAll(firstName, lastName) {
    let results;
    if(!lastName){
      results = await db.query(
        `SELECT id, 
           first_name AS "firstName",  
           last_name AS "lastName", 
           phone, 
           notes
         FROM customers
         WHERE first_Name LIKE '%' || $1 || '%'
         ORDER BY last_name, first_name`, [firstName]);
      console.log('RAN #1');
    } else if (!firstName) {
      results = await db.query(
        `SELECT id, 
          first_name AS "firstName",  
          last_name AS "lastName", 
          phone, 
          notes
        FROM customers
        WHERE last_Name LIKE '%' || $1 || '%'
        ORDER BY last_name, first_name`, [lastName]);
        console.log('RAN #2');
    } else {
      results = await db.query(
        `SELECT id, 
           first_name AS "firstName",  
           last_name AS "lastName", 
           phone, 
           notes
         FROM customers
         WHERE first_Name LIKE '%' || $1 || '%' AND last_Name LIKE '%' || $2 || '%'
         ORDER BY last_name, first_name`, [firstName, lastName]);
        console.log('RAN #3');
    }
    
    if (results === undefined) {
      const err = new Error(`No one by that name here!`);
      err.status = 404;
      throw err;
    }
    return results.rows.map(c => new Customer(c));
  }



  /** return full name of customer in one string. */
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  }

  /** get all reservations for this customer. */

  async getReservations() {
    return await Reservation.getReservationsForCustomer(this.id);
  }

  /** save this customer. */

  async save() {
    if (this.id === undefined) {
      const result = await db.query(
        `INSERT INTO customers (first_name, last_name, phone, notes)
             VALUES ($1, $2, $3, $4)
             RETURNING id`,
        [this.firstName, this.lastName, this.phone, this.notes]
      );
      this.id = result.rows[0].id;
    } else {
      await db.query(
        `UPDATE customers SET first_name=$1, last_name=$2, phone=$3, notes=$4
             WHERE id=$5`,
        [this.firstName, this.lastName, this.phone, this.notes, this.id]
      );
    }
  }
}

module.exports = Customer;