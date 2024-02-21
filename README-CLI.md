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
db.customers.find({name: 'Tom'}).sort({lastName: 1}) // descending == -1
db.customers.findOne({name: 'Tom'})

// Also insertMany([...])
db.customers.insertOne({
  name: 'Tomas',
  createdOn: Date()
})

// remove vs delete: different return type
db.customers.remove({name: 'Tomas'})
db.customers.deleteOne({name: 'Tomas'}) // also deleteMany
db.customers.drop()
```

### Updating

```js
db.customers.updateOne({name: 'Tomas'}, {
  $set: {name: 'Thomas'},
  {upsert: true}
})

db.customers.updateOne({ $unset: { name: '' } })

db.customers.update({name: 'Tomas'}, {
  $inc: {age: 1}
})

db.customers.update({name: 'Tomas'}, {
  $rename: {name: 'firstName'}
})

// Update the score only if it is lower than 150
db.scores.insertOne( { _id: 1, score: 200 } )
db.scores.updateOne( { _id: 1 }, { $min: { score: 150 } } )
```

Or with a loop

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

db.customers.find({name: {$regex: 'Th?om(as)?\\b'}})
db.customers.find({name: /th?om(as)?\b/i})



db.comments.find({member_since: {$lt: 90}})
db.comments.find({member_since: {$lte: 90}})
db.comments.find({member_since: {$gt: 90}})
db.comments.find({member_since: {$gte: 90}})

$ne : not equal
$exists : db.coll.find({name: {$exists: true}})
$type : db.coll.find({'zipCode': {$type: 'string'}}) // int, object, date, double, binData, ...
$or: [{name: 'Tomas'}, {name: 'Thomas'}] // $and, $nor
```


### Dates

```js
db.customers.find({birthdate: {$lt: ISODate("1968-01-01T00:00:00.000Z")}})
```

### Aggregating

```js
$sum: db.docx.aggregate([{$group : {_id : "$operator", num_docx : {$sum : "$value"}}}])
$avg: db.docx.aggregate([{$group : {_id : "$operator", num_docx : {$avg : "$value"}}}])

$min / $max: db.docx.aggregate([{$group : {_id : "$operator", num_docx : {$min : "$value"}}}])

$first / $last: db.docx.aggregate([{$group : {_id : "$operator", last_class : {$last : "$value"}}}])

db.users.aggregate([
  {$match: {access: "valid"}},
  {$group: {_id: "$cust_id", total: {$sum: "$amount" }}},
  {$sort: {total: -1}}
])


db.users.distinct('name')
// Also: mapReduce?


// Arrays
$push: db.docx.aggregate([{$group : {_id : "$operator", classes : {$push: "$value"}}}])
$addToSet (no duplicates): db.docx.aggregate([{$group : {_id : "$operator", classes : {$addToSet : "$value"}}}])

db.coll.find({tags: {$all: ["Realm", "Charts"]}})
db.coll.find({field: {$size: 2}}) // impossible to index - prefer storing the size of the array & update it
db.coll.find({results: {$elemMatch: {product: "xyz", score: {$gte: 8}}}})

db.coll.updateOne({"_id": 1}, {$push :{"array": 1}})
db.coll.updateOne({"_id": 1}, {$pull :{"array": 1}})
db.coll.updateOne({"_id": 1}, {$addToSet :{"array": 2}})
db.coll.updateOne({"_id": 1}, {$pop: {"array": 1}})  // last element
db.coll.updateOne({"_id": 1}, {$pop: {"array": -1}}) // first element
db.coll.updateOne({"_id": 1}, {$pullAll: {"array" :[3, 4, 5]}})
db.coll.updateOne({"_id": 1}, {$push: {"scores": {$each: [90, 92]}}})
db.coll.updateOne({"_id": 2}, {$push: {"scores": {$each: [40, 60], $sort: 1}}}) // array sorted
db.coll.updateOne({"_id": 1, "grades": 80}, {$set: {"grades.$": 82}})
db.coll.updateMany({}, {$inc: {"grades.$[]": 10}})
db.coll.updateMany({}, {$set: {"grades.$[element]": 100}}, {multi: true, arrayFilters: [{"element": {$gte: 100}}]})

// FindOneAndUpdate



db.posts.find({
  comments: { $elemMatch: { name: 'Thomas' } } }
)
// Also: $in, $nin


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

### Change Streams

```js
watchCursor = db.docx.watch( [ { $match : {'operationType' : 'insert' } } ] )
while (!watchCursor.isExhausted()) {
  if (watchCursor.hasNext()) {
    print(tojson(watchCursor.next()));
  }
}
```
