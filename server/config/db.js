import mongoose from 'mongoose';

export const connectDB = async () => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellmeet';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return true;
  } catch (error) {
    if (uri.startsWith('mongodb+srv://') && (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED'))) {
      try {
        console.log('SRV DNS lookup failed via system DNS, attempting direct replica set connection...');
        const match = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+)?/);
        if (match) {
          const [, user, pass, host, db] = match;
          const dbName = db || 'intellmeet';
          const directUri = `mongodb://${user}:${pass}@ac-jprxhcm-shard-00-00.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-01.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-02.tiylser.mongodb.net:27017/${dbName}?ssl=true&replicaSet=atlas-hdd5w0-shard-0&authSource=admin&retryWrites=true&w=majority`;
          const conn = await mongoose.connect(directUri, { serverSelectionTimeoutMS: 8000 });
          console.log(`MongoDB Connected to Atlas: ${conn.connection.host}`);
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
