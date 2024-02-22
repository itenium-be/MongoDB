// Update the data/customers.json
const fs = require('fs')

var customers = fs.readFileSync('./data/customers.json')
customers = JSON.parse(customers)

// Turn the generated tier_and_details object keys into an array
// customers = customers.map(customer => ({
//   ...customer,
//   tier_and_details: Object.values(customer.tier_and_details)
// }))


// Split first & last names
customers = customers.map(customer => ({
  ...customer,
  name: customer.name.split(' ')[0],
  lastName: customer.name.substring(customer.name.indexOf(' ') + 1)
}))



fs.writeFileSync('./data/customers-upd.json', JSON.stringify(customers, null, 0))
// "Format": \{"_id":\{"\$oid" -> \n$0
