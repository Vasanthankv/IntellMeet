import mongoose from 'mongoose';
import dns from 'dns';

// Ensure fast IPv4 resolution and avoid SRV DNS lookup hangs
if (dns && dns.setDefaultResultOrder) {
  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (e) {}
}

const FALLBACK_ATLAS_URI = 'mongodb://vasanthankv_0309:VASANTHANKV0309@ac-jprxhcm-shard-00-00.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-01.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-02.tiylser.mongodb.net:27017/intellmeet?ssl=true&replicaSet=atlas-hdd5w0-shard-0&authSource=admin&retryWrites=true&w=majority';

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
export let lastDbError = null;
export let lastAttemptedUri = null;
export let lastConnectedHost = null;

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return true;
  }
  if (isConnecting) {
    return false;
  }
  isConnecting = true;

  const rawEnvUri = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.MONGO_URL || process.env.DATABASE_URL;
  // If no env provided or localhost in production, use verified Atlas replica set
  const uri = rawEnvUri && !rawEnvUri.includes('127.0.0.1') && !rawEnvUri.includes('localhost') 
    ? rawEnvUri 
    : FALLBACK_ATLAS_URI;

  const mongooseOptions = {
    serverSelectionTimeoutMS: 8000,
    connectTimeoutMS: 8000,
    socketTimeoutMS: 45000,
    maxPoolSize: 20,
    minPoolSize: 2,
    family: 4,
  };

  // Attach persistent lifecycle listeners once
  if (!listenersAttached) {
    listenersAttached = true;
    mongoose.connection.on('connected', () => {
      lastConnectedHost = mongoose.connection.host;
      console.log(`✅ MongoDB Connection Active (readyState: 1, host: ${mongoose.connection.host})`);
    });
    mongoose.connection.on('error', (err) => {
      lastDbError = err?.message || String(err);
      console.warn(`⚠️ MongoDB connection error: ${lastDbError}`);
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
  const parsed = parseMongoUri(uri);
  if (parsed && (parsed.host.includes('tiylser.mongodb.net') || uri.includes('tiylser.mongodb.net'))) {
    const directReplicaUri = `mongodb://${parsed.user}:${parsed.pass}@ac-jprxhcm-shard-00-00.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-01.tiylser.mongodb.net:27017,ac-jprxhcm-shard-00-02.tiylser.mongodb.net:27017/${parsed.db || 'intellmeet'}?ssl=true&replicaSet=atlas-hdd5w0-shard-0&authSource=admin&retryWrites=true&w=majority`;
    urisToTry.push(directReplicaUri);
    if (!urisToTry.includes(uri)) {
      urisToTry.push(uri);
    }
  } else {
    urisToTry.push(uri);
    if (!urisToTry.includes(FALLBACK_ATLAS_URI)) {
      urisToTry.push(FALLBACK_ATLAS_URI);
    }
  }

  for (const connUri of urisToTry) {
    try {
      lastAttemptedUri = connUri.replace(/:([^:@]+)@/, ':****@');
      console.log(`📡 Connecting to MongoDB: ${lastAttemptedUri}...`);
      const conn = await mongoose.connect(connUri, mongooseOptions);
      lastConnectedHost = conn.connection.host;
      lastDbError = null;
      console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host} (readyState: ${mongoose.connection.readyState})`);
      isConnecting = false;
      return true;
    } catch (err) {
      lastDbError = err.message;
      console.warn(`⚠️ Connection attempt failed for ${connUri.slice(0, 30)}...: ${err.message}`);
    }
  }

  isConnecting = false;
  console.warn(`MongoDB Connection Failed after trying all endpoints. Last error: ${lastDbError}`);
  return false;
};
