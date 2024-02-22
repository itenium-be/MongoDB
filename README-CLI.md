Mongo CLI
=========

```sh
show dbs
use crm
show collections
db.dropDatabase()
exit
```


## Collections

```js
db.createCollection('customers')
db.getCollection('customers').help()

// Shorter than getCollection()
db.customers.find().pretty()
db.customers.find({name: 'Tom'}).count()
db.customers.estimatedDocumentCount()
db.customers.find({name: 'Tom'}).skip(5).limit(5)
db.customers.distinct('name')
db.customers.find({}).sort({name: 1}) // descending == -1
db.customers.findOne({name: 'Tom'})

// Also insertMany([...])
db.customers.insertOne({
  _id: ObjectId("5099803df3f4948bd2f98391"),
  active: true,
  name: 'Tomas',
  audit: {
    createdOn: new Date(),
    modifiedBy: [{
      by: 'admin', // in a query: audit.modifiedBy.0.by
      on: Date()
    }]
  },
  profileViews: NumberLong(1250000)
})

// remove vs delete: different return type
db.customers.remove({name: 'Tomas'})
db.customers.deleteOne({name: 'Tomas'}) // also deleteMany
db.customers.drop()
```


### Updating

```js
db.customers.updateOne(
  {name: 'Tomas'},
  {$set: {name: 'Thomas'}},
  {upsert: true}
)

db.customers.updateOne({
  $unset: {name: ''}
})

db.customers.updateMany(
  {name: 'Tomas'},
  {$inc: {age: 1}}
)

db.customers.updateMany(
  {name: 'Tomas'},
  {$rename: {name: 'firstName'}}
)

// Update the score to 150 only if it is currently higher than 150
db.scores.insertOne({_id: 1, score: 200})
db.scores.updateOne({_id: 1}, {$min: {score: 150}})
```

Or update with a loop:

```js
db.customers.find().forEach(function(doc) {
  print('Name: ' + doc.name);
})
```

### admin

Typically the collection with users to perform auth.

```js
show roles
show users

// https://www.mongodb.com/docs/manual/reference/method/db.createUser
db.createUser({user: 'major', pwd: 'pwd', roles: ['readWrite']})
db.auth('major', passwordPrompt())
db.changeUserPassword()
db.dropUser('major')
// Also: db.create/update/getRole, grant/revokePrivileges/RolesToRole

// Get a db without switching db
db.getSiblingDB('dbname')

db.customers.find({name: ''}).explain('executionStats') // or 'queryPlanner' or 'allPlansExecution'

db.currentOp()
db.killOp(345)
```



## Query Syntax

```js
// Projection: choose which fields to return
db.customers.find({}, {name: true, createdOn: false})

db.customers.find({name: {$regex: 'Tom\\b'}})
db.customers.find({name: /^t/i})

db.comments.find({member_since: {$lt: 90}})
// $lte (less than or equal), $gt (greater than), $gte, $ne (not equal)
// $exists: find({name: {$exists: true}})
// $type: find({'zipCode': {$type: 'string'}}) // int, object, date, double, binData, ...
// $or: [{name: 'Tomas'}, {name: 'Thomas'}] // $and, $nor, $not
```


### Dates

`new Date()` or `ISODate()`

```js
db.customers.find({birthdate: {$lt: ISODate("1968-01-01T00:00:00.000Z")}})

// Date operators:
// $dateAdd/Trunc, $dateDiff, $dateFrom/ToParts/String, $dayOfYear/Month/Week, $hour/$year
```


### Aggregating

```js
// Also: $min, $max, $count, $first/$last
db.customers.aggregate([
  { $group: {
    _id: {$year: '$birthdate'},
    count: {$sum: 1}
  }}
])


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
  {$sort: {year: -1}},
  {$limit: 5}
])


db.collection('locations').find({
  location: {
    $near: {
      $geometry: {type: 'Point', coordinates: [longitude, latitude]},
      $maxDistance: 1000
    }
  }
})


// find({accounts: {$size: {$gt: 5}}}) is not allowed
db.customers.aggregate([
  {$match: {$expr: {$gt: [{$size: '$accounts'}, 5]}}}
])
```

### Arrays

[Array Examples](https://www.mongodb.com/docs/manual/tutorial/query-arrays/#std-label-read-operations-arrays)


```js
// impossible to index - prefer storing the size of the array & update it
db.customers.find({accounts: {$size: 0}})

db.coll.updateOne({_id: 1}, {$push: {array: 1}})
db.coll.updateOne({_id: 1}, {$pull: {array: 1}})
db.coll.updateOne({_id: 1}, {$addToSet: {array: 2}})
db.coll.updateOne({_id: 1}, {$pop: {array: 1}}) // last element
db.coll.updateOne({_id: 1}, {$pop: {array: -1}}) // first element
db.coll.updateOne({_id: 1}, {$pullAll: {array: [3, 4, 5]}})

// $[] : positional all
db.coll.updateMany({}, {$inc: {"grades.$[]": 10}})

// $[el] with arrayFilters
// Set all grades >100 to 100
db.coll.updateMany(
  {},
  {$set: {'grades.$[element]': 100}},
  {multi: true, arrayFilters: [{'element': {$gt: 100}}]}
)
```


## Indexing

```js
db.customers.getIndexes()

db.customers.createIndex({name: 2}) // single field index
db.customers.createIndex({name: 2, date: 2}) // compound index

// Text index
db.customers.createIndex({name: 'text', address: 'text'})
db.customers.find({ $text: {$search: "Thomas"} })
db.coll.find({$text: {$search: 'cake'}}, {score: {$meta: 'textScore'}}).sort({score: {$meta: 'textScore'}})


db.customers.createIndex({'$**': 'text'}) // wildcard text index
db.customers.createIndex({'userMetadata.$**': 1}) // wildcard index

// For testing if an index actually improves performance:
db.coll.hideIndex('name_1')
db.coll.unhideIndex('name_1')

db.customers.dropIndex('name_3')

// Compound index
db.customers.ensureIndex({name : 3, operator : 1, class : 0})


db.customers.storageSize()
db.customers.totalIndexSize()
db.customers.totalSize()
```


## Other

### Lookup

Aggregate function to "LEFT JOIN" another collection.

```ts
{
  $lookup: {
    from: <collection to join>,
    localField: <field from the input documents>,
    foreignField: <field from the documents of the "from" collection>,
    as: <output array field>
  }
}
```



### Change Streams

Real-time notifications on collection changes with a cursor.

```js
watchCursor = db.docx.watch( [ { $match : {'operationType' : 'insert' } } ] )
while (!watchCursor.isExhausted()) {
  if (watchCursor.hasNext()) {
    print(tojson(watchCursor.next()));
  }
}
```
