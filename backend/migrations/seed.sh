#!/bin/bash
# Insertion des données initiales (ex: admin, secteurs)

DB_USER=regulagse_user
DB_NAME=regulagse_db
SEED_FILE="migrations/seed_data.sql"

echo "Seeding initial data..."
psql -h localhost -U $DB_USER -d $DB_NAME -f $SEED_FILE

echo "Done."