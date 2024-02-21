#! /bin/bash

echo "Importing data"

MONGO_DATABASE="crm"

mongoimport --db $MONGO_DATABASE --collection customers --jsonArray --file /database/mongo-seed/customers.json
