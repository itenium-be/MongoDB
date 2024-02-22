MongoDB
=======

```sh
docker compose up -d
```

This will launch a GUI at `http://localhost:27018`.  
Connect to your local IP and not to localhost!


Links
-----

- GUI
  - [Compass](https://www.mongodb.com/try/download/compass)
  - [Studio 3T](https://studio3t.com/download/)
- Cheat Sheets
  - ChatGPT 😃
  - See file: `MongoDBShell-CheatSheet.pdf`
  - [Official CheatSheet](https://www.mongodb.com/developer/products/mongodb/cheat-sheet/)
  - [MQL to SQL](https://www.mongodb.com/docs/manual/reference/sql-aggregation-comparison/)
  - [Practical MongoDB Aggregations](https://www.practical-mongodb-aggregations.com/front-cover.html)


Customers
---------

Port: `27017`  
Database: `crm`  
Collection: `customers`  


### Restore

Want to start with a fresh database?

```sh
docker compose down --volumes
docker compose up -d
```


### Exercises

- Find all customers born between 1968 and 1970 (45 records)
- Find all customers with name: Thomas, Tomas or Tom (5 records)
- Aggregate the results of the previous query to `[{name: 'Tom', amount: 2}]`
  - Project the result to: `{tomas: 1, tom: 2, thomas: 2}`
  - Hint: You can use multiple `$group` in the aggregate pipeline
  - Hint: You might need `$arrayToObject`
- Find everyone that has an `accounts` that is not numeric (see `$type: 'int'`) (3 records)
  - `updateMany` to remove all `null` and `''` array values
  - Challenge: Convert all strings that contain a number to ints (see `$convert(val, 'int')`)
- Find all customers with `tier_and_details.tier: 'Platinum'` without `benefit: dedicated account representative` (88 records)
- Challenge: Add a `tier_and_details.benefits` with value `'dedicated account representative'` for every `tier: Platinum`
  - Hint: Checkout `arrayFilters`
  - Do not add if already present! (Hint: `$addToSet`)


#### Migration

Currently the benefits for a certain tier are different for each customer.  
We want to normalize this. Each tier should have the same benefits.

Insert our new tiers:

```js
db.tiers.insertMany([
  {tier: 'Bronze', benefits: ['24 hour dedicated line', 'sports tickets']},
  {tier: 'Silver', benefits: ['car rental insurance', 'travel insurance']},
  {tier: 'Gold', benefits: ['concert tickets', 'shopping discounts']},
  {tier: 'Platinum', benefits: ['airline lounge access', 'dedicated account representative']}
])
```

- Update all customers, in the `tier_and_details`
  - remove `benefits`
  - replace the `tier` (Bronze, ...) with the `tiers._id`
- Rename `tier_and_details` to `tiers`
- Optional: Create a report of what changes our customers can expect after these changes (benefits added/removed)


Expected resulting structure:

```json
{
  "_id": ObjectId("5ca4bbcea2dd94ee58162a7f"),
  "username": "archersarah",
  "name": "Brittany",
  "lastName": "Ellis",
  "address": "81536 Underwood Freeway\nTurnerfort, OK 97967",
  "birthdate": ISODate("1969-04-19T21:19:01.000Z"),
  "email": "jonathankennedy@gmail.com",
  "accounts": [
    836981
  ],
  "tiers": [{
    "tier": <tiersCollection._id>,
    "active": true,
    "id": "dd5df395a37241968c1eefe285fe3af1"
  }]
}
```


#### Security

A security audit has revealed that an unprotected mongo is maybe not such a great idea.  
Add a user with readWrite access and disable connections without credentials.
