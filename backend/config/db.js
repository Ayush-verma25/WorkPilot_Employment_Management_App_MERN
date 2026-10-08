import mongoose from "mongoose";

let connectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 0) {
    connectionPromise = undefined;
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI must be configured.");
  }

  if (!connectionPromise) {
    mongoose.connection.on("connected", () => console.log("MongoDB Connected"));
    connectionPromise = mongoose
      .connect(uri, { maxPoolSize: 10 })
      .then(() => mongoose.connection)
      .catch((error) => {
        connectionPromise = undefined;
        console.error("Database connection failed:", error.message);
        throw error;
      });
  }

  try {
    return await connectionPromise;
  } catch (error) {
    if (mongoose.connection.readyState === 0) {
      connectionPromise = undefined;
    }
    throw error;
  }
};

export default connectDB;