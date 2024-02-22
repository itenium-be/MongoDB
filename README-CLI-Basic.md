Basic CLI
=========

```js
use crm
db.customers.help()


// MQL & BSON example:
db.users.insertOne({
  _id: ObjectId("5099803df3f4948bd2f98391"),
  active: true,
  name: 'Tomas',
  audit: {
    createdOn: ISODate("2024-01-01T00:00:00Z"),
    modifiedBy: [{
      by: 'admin', // in a query: audit.modifiedBy.0.by
      on: new Date()
    }]
  },
  profileViews: NumberLong(1250000)
})
```


## CRM > Customers

See `customers/CustomerStructure.md` for the structure of a customer.  
See `README.md` for some GUIs your can use (or use `localhost:27018`)


```js
// findOne & find
// https://www.mongodb.com/docs/manual/reference/method/db.collection.find
db.customers.findOne({name: 'Tom'})
db.customers.find({name: /^T/})

db.customers.find({}).sort({name: 1}) // -1 for descending
// Also: skip, limit, count, forEach, pretty

// With projection -- do not return the _id
db.customers.find({name: 'Tom'}, {_id: 0})
```


## Query Syntax

```js
db.customers.find({birthdate: {$lt: ISODate('1968-01-01')}})

// $isNumber
// $lt: less than
// $lte: less or equal
// $gt & $gte
// $ne: not equal

// $or, $and & $not
// $or: [{name: 'Tomas'}, {name: 'Thomas'}]
```


### Arrays

```js
db.customers.find({'accounts.5': {$exists: true}})
db.customers.find({'tier_and_details': {$size: 3}})


// Find null in the accounts array
db.customers.find({
  accounts: {$elemMatch: {$eq: null}}
})
```


### Aggregate

`aggregate` accepts an array of "Aggregation Stages":  
Common: `$match`, `$group`, `$project`, `$sort`, `$skip & $limit`  
Other: `$addFields`, `$lookup`, `$replaceRoot`, `$unwind`, `$sample` & `$out`


Reference a field: `$fieldName`.  
Reference a variable: `$$var` (for example with `$let` or `$map`)  

```js
db.customers.aggregate([
  {
    $group: {
      _id: {$year: '$birthdate'},
      count: {$sum: 1}
    }
  }
])

// Also: $min, $max, $count, $first/$last
// Maths: $multiply: [], $add: [], $ceil/$floor/$round, $divide
// Strings: $concat, $l/rtrim, $trim, $replaceOne/All, $strcasecmp, $substr, $toLower/Upper
// Dates: $dateAdd/Trunc, $dateDiff, $dateFrom/ToParts/String, $dayOfYear/Month/Week, $hour/$year
// Convert: $ifNull, $cond, $convert({input: <val>, to: 'int'}) // string, bool, date, ...
// Or: $toDecimal, $toObjectId, $toLong, $toDouble, ...



// Average on a Date
db.customers.aggregate([
  {$match: {username: {$ne: null}}},
  {$addFields: {numericBirthDate: {$toLong: '$birthdate'}}},
  {
    $group: {
      _id: {$year: '$birthdate'},
      averageNumericBirthDate: {$avg: '$numericBirthDate'},
      count: {$sum: 1}
    }
  },
  {$addFields: {averageBirthDate: {$dateToString: {format: '%Y-%m-%d', date: {$toDate: '$averageNumericBirthDate'}}}}},
  {$project: {year: '$_id', count: 1, averageBirthDate: 1, _id: 0}},
  {$sort: {year: -1}}
])


// Arrays
// Syntax in find, update and $match:
db.customers.find({'accounts': {$size: 0}})

// Syntax in aggregate expressions
db.customers.aggregate([
  {$project:
    {hasAccount:
      {$cond:
        {
          if: {$eq: [{$size: '$accounts'}, 0]},
          then: false,
          else: true
        }
      }
    }
  }
])

// Also: $isArray, $all, $in, $nin, $elemMatch, $map, $reduce
```



### Updating

Also `deleteOne` & `deleteMany`

```js
db.customers.updateOne(
  {name: 'Tomas'},
  {$set: {name: 'Thomas'}},
  {upsert: true} // update or insert
)
// $set or: $unset, $rename, ...

// Push to array
db.customers.updateMany(
  {name: 'Tomas'},
  {$push: {'accounts': 12345}}
)
```
