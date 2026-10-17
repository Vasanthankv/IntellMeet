import mongoose from 'mongoose';
import dns from 'dns';

// Ensure fast IPv4 resolution and avoid SRV DNS lookup hangs
if (dns && dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}
// Set fast reliable public DNS servers for Atlas SRV lookups
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (e) {
  // Ignore in restricted environments
}

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellmeet';

  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 5,
    family: 4,
  };

  try {
    const conn = await mongoose.connect(uri, mongooseOptions);
    console.log(`✅ MongoDB Connected to Atlas: ${conn.connection.host}`);
    return true;
  } catch (error) {
    if (uri.startsWith('mongodb+srv://') && (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED') || error.message.includes('timed out'))) {
      try {
        console.log('⚡ SRV DNS lookup slow/failed, immediately connecting to direct replica set...');
        const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)?/);
        if (match) {
          const [, user, pass, , db] = match;
          const dbName = db || 'intellmeet';
          const directUri = `mongodb://${user}:${pass}@ac-jprxhcm-shard-00-00.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-01.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-02.tiylser.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-hdd5w0-shard-0&authSource=admin&retryWrites=true&w=majority`;
          const conn = await mongoose.connect(directUri, mongooseOptions);
          console.log(`✅ MongoDB Connected to Atlas (Direct Replica Set): ${conn.connection.host}`);
          return true;
        }
      } catch (err2) {
        console.warn(`Direct connection failed: ${err2.message}`);
      }
    }
    console.warn(`MongoDB Connection Failed: ${error.message}`);
    console.warn(`Using fallback memory database mode for auth...`);
    return false;
  }
};
