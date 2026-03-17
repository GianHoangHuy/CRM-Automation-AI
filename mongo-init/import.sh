#!/bin/bash
set -e

DB_HOST="ecommerce-mongo"

echo ">>> BẮT ĐẦU IMPORT DỮ LIỆU TỰ ĐỘNG..."

# Chờ database chính khởi động xong
sleep 2

for file in /data/ecommerce.*.json; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        collection_name=$(echo "$filename" | cut -d'.' -f2)
        
        echo "Dang import file: $filename vao collection: $collection_name"

        mongoimport --host $DB_HOST \
                    --username root \
                    --password password123 \
                    --authenticationDatabase admin \
                    --db ecommerce_db \
                    --collection "$collection_name" \
                    --type json \
                    --file "$file" \
                    --jsonArray \
                    --drop
    fi
done

echo ">>> HOÀN TẤT IMPORT DỮ LIỆU!"