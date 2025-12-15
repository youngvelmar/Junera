#!/bin/bash
# Reset complet de la base de données et création des tables

DB_USER=regulagse_user
DB_NAME=regulagse_db
SCHEMA_FILE="migrations/schema_complete.sql"

echo "Dropping all tables..."
psql -h localhost -U $DB_USER -d $DB_NAME -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

echo "Creating tables from $SCHEMA_FILE..."
psql -h localhost -U $DB_USER -d $DB_NAME -f $SCHEMA_FILE

echo "Done."