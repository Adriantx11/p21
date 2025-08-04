import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Proxy from '../models/Proxy.js';

// Load environment variables
dotenv.config();

// Sample proxies (replace with real ones)
const sampleProxies = [
  {
    host: '192.168.1.100',
    port: 8080,
    protocol: 'http',
    country: 'United States'
  },
  {
    host: '10.0.0.50',
    port: 3128,
    protocol: 'http',
    country: 'Canada'
  },
  {
    host: '172.16.0.25',
    port: 8080,
    protocol: 'https',
    country: 'United Kingdom'
  },
  {
    host: '203.0.113.10',
    port: 8080,
    username: 'proxyuser',
    password: 'proxypass',
    protocol: 'http',
    country: 'Germany'
  },
  {
    host: '198.51.100.20',
    port: 1080,
    protocol: 'socks5',
    country: 'Netherlands'
  }
];

async function addSampleProxies() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing proxies (optional)
    const clearExisting = process.argv.includes('--clear');
    if (clearExisting) {
      await Proxy.deleteMany({});
      console.log('🗑️  Cleared existing proxies');
    }

    // Add sample proxies
    const results = {
      added: 0,
      skipped: 0,
      errors: 0
    };

    for (const proxyData of sampleProxies) {
      try {
        // Check if proxy already exists
        const existing = await Proxy.findOne({ 
          host: proxyData.host, 
          port: proxyData.port 
        });

        if (existing) {
          console.log(`⏭️  Skipped: ${proxyData.host}:${proxyData.port} (already exists)`);
          results.skipped++;
          continue;
        }

        // Create new proxy
        const proxy = new Proxy(proxyData);
        await proxy.save();
        
        console.log(`✅ Added: ${proxyData.host}:${proxyData.port} (${proxyData.country})`);
        results.added++;

      } catch (error) {
        console.error(`❌ Error adding ${proxyData.host}:${proxyData.port}:`, error.message);
        results.errors++;
      }
    }

    console.log('\n📊 Results:');
    console.log(`   Added: ${results.added}`);
    console.log(`   Skipped: ${results.skipped}`);
    console.log(`   Errors: ${results.errors}`);

    // Show total proxies
    const total = await Proxy.countDocuments();
    console.log(`\n📈 Total proxies in database: ${total}`);

    console.log('\n🎉 Sample proxies added successfully!');
    console.log('\n💡 Remember to:');
    console.log('   1. Replace sample proxies with real working proxies');
    console.log('   2. Test proxies before using in production');
    console.log('   3. Use the Proxy Manager in the admin panel to manage proxies');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
addSampleProxies(); 