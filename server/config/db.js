import mongoose from 'mongoose';
import dns from 'dns';

// Ensure fast IPv4 resolution and avoid SRV DNS lookup hangs
if (dns && dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (e) {}
}

const parseMongoUri = (rawUri) => {
  try {
    const withoutPrefix = rawUri.replace(/^mongodb(\+srv)?:\/\//, '');
    const [authAndHost, ...rest] = withoutPrefix.split('/');
    const [userPass, host] = authAndHost.split('@');
    if (!userPass || !host) return null;
    const [user, ...passParts] = userPass.split(':');
    const pass = passParts.join(':');
    const pathAndQuery = rest.join('/');
    const [db] = pathAndQuery ? pathAndQuery.split('?') : [''];
    return { user, pass, host, db: db || 'intellmeet' };
  } catch (e) {
    return null;
  }
};

let isConnecting = false;
let listenersAttached = false;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (isConnecting) {
    return false;
  }
  isConnecting = true;

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/intellmeet';

  const mongooseOptions = {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 2,
    family: 4,
  };

  // Attach persistent lifecycle listeners once
  if (!listenersAttached) {
    listenersAttached = true;
    mongoose.connection.on('connected', () => {
      console.log(`✅ MongoDB Connection Active (readyState: 1)`);
    });
    mongoose.connection.on('error', (err) => {
      console.warn(`⚠️ MongoDB connection error: ${err.message}`);
    });
    mongoose.connection.on('disconnected', () => {
      console.warn(`⚠️ MongoDB disconnected. Scheduling auto-reconnect in 5s...`);
      setTimeout(() => {
        connectDB().catch(() => {});
      }, 5000);
    });
  }

  // Generate connection URIs to try
  const urisToTry = [];

  // If this is the known Atlas cluster, add the direct 3-node replica set URI first
  // Direct connection avoids container-level SRV DNS query refusals (querySrv ECONNREFUSED)
  const parsed = parseMongoUri(uri);
  if (parsed && (parsed.host.includes('tiylser.mongodb.net') || uri.includes('tiylser.mongodb.net'))) {
    const directReplicaUri = `mongodb://${parsed.user}:${parsed.pass}@ac-jprxhcm-shard-00-00.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-01.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-02.tiylser.mongodb.net:27017/${parsed.db || 'intellmeet'}?ssl=true&replicaSet=atlas-hdd5w0-shard-0&authSource=admin&retryWrites=true&w=majority`;
    urisToTry.push(directReplicaUri);
    if (!urisToTry.includes(uri)) {
      urisToTry.push(uri);
    }
  } else {
    urisToTry.push(uri);
  }

  for (const connUri of urisToTry) {
    try {
      const sanitizedLog = connUri.replace(/:([^:@]+)@/, ':****@');
      console.log(`📡 Connecting to MongoDB: ${sanitizedLog}...`);
      const conn = await mongoose.connect(connUri, mongooseOptions);
      console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} (readyState: ${mongoose.connection.readyState})`);
      isConnecting = false;
      return true;
    } catch (err) {
      console.warn(`⚠️ Connection attempt failed for ${connUri.slice(0, 30)}...: ${err.message}`);
    }
  }

  isConnecting = false;
  console.warn(`MongoDB Connection Failed after trying all endpoints.`);
  console.warn(`Using fallback memory database mode for auth & data resilience.`);
  return false;
};
