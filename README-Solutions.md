Exercise Solutions
==================

## Customers born between 1968 and 1970

```ts
db.customers.find({
  $and: [
    {birthdate: {$gte: ISODate("1968-01-01")}},
    {birthdate: {$lt: ISODate("1971-01-01")}}
  ]
})

db.customers.find({
  birthdate: {$gte: ISODate("1968-01-01"), $lt: ISODate("1971-01-01")}
})

db.customers.aggregate([{$match: {
  birthdate: {$gte: ISODate("1968-01-01"), $lt: ISODate("1971-01-01")}}
}])
```
















## Thomas, Tomas or Tom

```js
db.customers.find({name: /(Th?omas|Tom)\b/})

db.customers.find({name: {$in: ['Thomas', 'Tomas', 'Tom']}})

db.customers.find({
  $or: [
    {name: 'Thomas'},
    {name: 'Tomas'},
    {name: 'Tom'}
  ]
})
```












### Aggregate

```js
db.customers.aggregate([
  {$match: {name: /Th?om(as)?\b/}},
  {$group: {_id: '$name', amount: {$sum: 1}}},
  {$project: {name: '$_id', _id: 0, amount: 1}},
])

db.customers.aggregate([
  {$match: {name: /Th?om(as)?\b/}},
  {$group: {_id: '$name', count: {$sum: 1}}},
  {$group: {_id: null, data: {$push: {k: {$toLower: '$_id'}, v: '$count'}}}},
  {$replaceRoot: {newRoot: {$arrayToObject: '$data'}}}
])
```












## Non-numeric accounts

```js
db.customers.find({
  accounts: {$elemMatch: {$not: {$type: 'int'}}}
})
```











### Delete empty values

```js
db.customers.updateMany(
  {},
  {$pull: {accounts: {$in: [null, '']}}}
)



db.customers.aggregate([
  {$match: {accounts: /\d+/}},
  {
    $project: {
      intAccounts: {
        $map: {
          input: "$accounts",
          as: "accountNr",
          in: { $toInt: "$$accountNr" }
        }
      }
    }
  }
]).forEach(function(acc) {
  db.customers.updateOne(
    {_id: acc._id},
    {$set: {accounts: acc.intAccounts}}
  )
})
```











## Find all Platinum

```js
db.customers.find({'tier_and_details.tier': 'Platinum'})

// This will find customers that have a DAP in a tier other than the Platinum one
db.customers.find(
  $and: [
    {'tier_and_details.tier': 'Platinum'},
    {'tier_and_details.benefits': 'dedicated account representative'}
  ]
)

// Aggregate to the rescue
db.customers.aggregate([
  {
    $match: {
      tier_and_details: {
        $elemMatch: {tier: 'Platinum', benefits: {$ne: 'dedicated account representative'}}
      }
    }
  }
  // Add to perform a count()
  // , {$group: {_id: null, count: {$sum: 1}}}
])


// Alternative solution
db.customers.find({
  tier_and_details: {
    $elemMatch: {
      tier: 'Platinum',
      benefits: {
        $not: {
          $elemMatch: { $eq: 'dedicated account representative' }
        }
      }
    }
  }
})
```









## Add rep to Platinum

```js
db.customers.updateMany(
  {
    tier_and_details: {$elemMatch: {tier: 'Platinum', benefits: {$ne: 'dedicated account representative'}}}
  },
  {
    $addToSet: {'tier_and_details.$[element].benefits': 'dedicated account representative'}
  },
  {
    multi: true,
    arrayFilters: [
      {'element.tier': 'Platinum', 'element.benefits': {$ne: 'dedicated account representative'}}
    ]
  }
)
```
