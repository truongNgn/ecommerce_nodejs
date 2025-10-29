// Import data từ backup JSON files vào MongoDB
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://admin:password123@localhost:27017/ecommerce?authSource=admin';

// Đường dẫn đến thư mục db
// Trong Docker: db/ nằm cùng level với backend/
// Trong Local: db/ nằm ở ../db (parent folder)
const DB_BACKUP_PATH = fs.existsSync(path.join(__dirname, 'db')) 
  ? path.join(__dirname, 'db')  // Docker
  : path.join(__dirname, '../db'); // Local

// Function để convert MongoDB JSON ($oid, $date) sang JS objects
function convertMongoJSON(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(convertMongoJSON);
  }

  // Handle MongoDB extended JSON
  if (obj.$oid) {
    return obj.$oid;
  }
  if (obj.$date) {
    return new Date(obj.$date);
  }
  if (obj.$numberInt) {
    return parseInt(obj.$numberInt);
  }
  if (obj.$numberLong) {
    return parseInt(obj.$numberLong);
  }
  if (obj.$numberDouble) {
    return parseFloat(obj.$numberDouble);
  }

  // Recursively convert nested objects
  const converted = {};
  for (const key in obj) {
    converted[key] = convertMongoJSON(obj[key]);
  }
  return converted;
}

// Function để import collection
async function importCollection(collectionName, filePath) {
  try {
    console.log(`\n📦 Importing ${collectionName}...`);
    
    // Read JSON file
    const rawData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(rawData);
    
    // Convert MongoDB extended JSON
    const convertedData = convertMongoJSON(jsonData);
    
    // Get collection
    const collection = mongoose.connection.collection(collectionName);
    
    // Check if collection already has data
    const count = await collection.countDocuments();
    if (count > 0) {
      console.log(`⚠️  ${collectionName} already has ${count} documents. Skipping...`);
      return;
    }
    
    // Insert data
    if (convertedData.length > 0) {
      await collection.insertMany(convertedData);
      console.log(`✅ Imported ${convertedData.length} documents to ${collectionName}`);
    } else {
      console.log(`⚠️  No data to import for ${collectionName}`);
    }
  } catch (error) {
    console.error(`❌ Error importing ${collectionName}:`, error.message);
  }
}

// Main import function
async function importAllData() {
  try {
    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                    ║');
    console.log('║              📥 IMPORTING BACKUP DATA TO MONGODB                  ║');
    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    console.log('URI:', MONGODB_URI.replace(/:[^:@]+@/, ':****@')); // Hide password
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB:', mongoose.connection.name);

    // Import collections
    const collections = [
      { name: 'users', file: 'ecommerce.users.json' },
      { name: 'products', file: 'ecommerce.products.json' },
      { name: 'carts', file: 'ecommerce.carts.json' },
      { name: 'orders', file: 'ecommerce.orders.json' },
      { name: 'reviews', file: 'ecommerce.reviews.json' },
      { name: 'discountcodes', file: 'ecommerce.discountcodes.json' }
    ];

    for (const { name, file } of collections) {
      const filePath = path.join(DB_BACKUP_PATH, file);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${file}. Skipping...`);
        continue;
      }
      
      await importCollection(name, filePath);
    }

    console.log('\n╔════════════════════════════════════════════════════════════════════╗');
    console.log('║                                                                    ║');
    console.log('║                  ✅ IMPORT COMPLETED SUCCESSFULLY!                ║');
    console.log('║                                                                    ║');
    console.log('╚════════════════════════════════════════════════════════════════════╝\n');

    // Display summary
    console.log('📊 Database Summary:');
    for (const { name } of collections) {
      try {
        const collection = mongoose.connection.collection(name);
        const count = await collection.countDocuments();
        console.log(`   ${name.padEnd(20)} : ${count} documents`);
      } catch (error) {
        console.log(`   ${name.padEnd(20)} : Error getting count`);
      }
    }

    console.log('\n✅ Ready to use!');
    console.log('   Backend: http://localhost:5000');
    console.log('   Frontend: http://localhost:3000');
    console.log('\n');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB\n');
  }
}

// Run import
if (require.main === module) {
  importAllData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { importAllData, importCollection };
