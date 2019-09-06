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
         WHERE lower(first_Name) LIKE '%' || $1 || '%'
         ORDER BY last_name, first_name`, [firstName]);
    } else if (!firstName) {
      results = await db.query(
        `SELECT id, 
          first_name AS "firstName",  
          last_name AS "lastName", 
          phone, 
          notes
        FROM customers
        WHERE lower(last_Name) LIKE '%' || $1 || '%'
        ORDER BY last_name, first_name`, [lastName]);
    } else {
      results = await db.query(
        `SELECT id, 
           first_name AS "firstName",  
           last_name AS "lastName", 
           phone, 
           notes
         FROM customers
         WHERE lower(first_Name) LIKE '%' || $1 || '%' AND lower(last_Name) LIKE '%' || $2 || '%'
         ORDER BY last_name, first_name`, [firstName, lastName]);
    }
    
    if (results === undefined) {
      const err = new Error(`No one by that name here!`);
      err.status = 404;
      throw err;
    }
    return results.rows.map(c => new Customer(c));
  }

  static async topCustomers() {
    const results = await db.query(
      `SELECT first_name AS "firstName", last_name AS "lastName", customers.id, phone, customers.notes, COUNT(reservations.id) as top_customers 
          FROM customers
          JOIN reservations
          ON customers.id = reservations.customer_id
          GROUP BY "firstName", "lastName", customers.id, phone, customers.notes
          ORDER BY top_customers DESC
          LIMIT 10`
    );
    return results.rows.map(c => {
      let customer = new Customer(c);
      customer.reservations = c.top_customers;
      return customer;
    });
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