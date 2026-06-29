import mongoose from "mongoose";
import { Admin } from "./server/models/Admin.js";

const publicKey = "uppepnqf";
const privateKey = "a94ec1cc-9275-49db-921a-aaebd3817ca9";
const host = "atlas-sql-6a3d389cf3218e7923f8f00b-ipicz8.a.query.mongodb.net";
const dbName = "sample_mflix";

const attempts = [
  { name: "authSource=admin", uri: `mongodb://${publicKey}:${privateKey}@${host}/${dbName}?ssl=true&authSource=admin` },
  { name: "authSource=$external & authMechanism=PLAIN", uri: `mongodb://${publicKey}:${privateKey}@${host}/${dbName}?ssl=true&authSource=%24external&authMechanism=PLAIN` },
  { name: "authSource=$external & authMechanism=MONGODB-AWS", uri: `mongodb://${publicKey}:${privateKey}@${host}/${dbName}?ssl=true&authSource=%24external&authMechanism=MONGODB-AWS` },
  { name: "Default authSource (none)", uri: `mongodb://${publicKey}:${privateKey}@${host}/${dbName}?ssl=true` }
];

async function test() {
  for (const attempt of attempts) {
    console.log(`\nTesting connection with [${attempt.name}]...`);
    try {
      const conn = await mongoose.connect(attempt.uri, { serverSelectionTimeoutMS: 5000 });
      console.log(`✅ mongoose.connect succeeded! Host: ${conn.connection.host}`);
      
      console.log("Attempting Admin.countDocuments()...");
      const count = await Admin.countDocuments();
      console.log("Count is:", count);
      await mongoose.disconnect();
      return;
    } catch (err: any) {
      console.error("❌ ERROR:", err.message);
      try {
        await mongoose.disconnect();
      } catch (e) {}
    }
  }
}

test();
