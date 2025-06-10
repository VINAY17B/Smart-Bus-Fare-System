import { MongoClient, type Db, type Collection, type OptionalId } from "mongodb"

interface Trip {
  id: string
  userId: string
  startLocation: {
    lat: number
    lng: number
  }
  userStartLocation?: {
    lat: number
    lng: number
    timestamp: string
  } | null
  startTime: string
  endLocation?: {
    lat: number
    lng: number
  }
  userEndLocation?: {
    lat: number
    lng: number
    timestamp: string
  } | null
  endTime?: string
  distance?: number
  straightLineDistance?: number
  fare?: number
  status: "started" | "completed"
  gpsPath?: Array<{ lat: number; lng: number; timestamp: string }>
  totalGPSDistance?: number
  lastGPSUpdate?: string
}

interface User {
  id: string
  name: string
  balance: number
}

// In-memory data store for development
const trips: Trip[] = []
const users: User[] = []

// MongoDB connection
let client: MongoClient | null = null
let db: Db | null = null
let isConnected = false

async function connectToDatabase() {
  if (isConnected && client && db) {
    return { client, db }
  }

  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      console.warn("MONGODB_URI not set, using in-memory storage")
      return { client: null, db: null }
    }

    client = new MongoClient(uri)
    await client.connect()
    db = client.db("smart_bus_fare")
    isConnected = true

    console.log("Connected to MongoDB")
    return { client, db }
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error)
    return { client: null, db: null }
  }
}

// Enhanced error handling and logging
export async function createTrip(trip: Trip): Promise<Trip> {
  try {
    const { db } = await connectToDatabase()

    if (db) {
      const collection: Collection<Trip> = db.collection("trips")
      const tripToInsert: OptionalId<Trip> = { ...trip }
      await collection.insertOne(tripToInsert)
      console.log("✅ Trip created in MongoDB:", trip.id)
    } else {
      // Fallback to in-memory
      trips.push({ ...trip })
      console.log("✅ Trip created in memory:", trip.id)
    }

    return trip
  } catch (error) {
    console.error("❌ Error creating trip, falling back to in-memory:", error)
    trips.push({ ...trip })
    return trip
  }
}

export async function getTrip(id: string): Promise<Trip | null> {
  try {
    const { db } = await connectToDatabase()

    if (db) {
      const collection: Collection<Trip> = db.collection("trips")
      const trip = await collection.findOne({ id })
      console.log("📖 Retrieved trip from MongoDB:", trip?.id, "Status:", trip?.status)
      return trip
    } else {
      // Fallback to in-memory
      const trip = trips.find((t) => t.id === id) || null
      console.log("📖 Retrieved trip from memory:", trip?.id, "Status:", trip?.status)
      return trip
    }
  } catch (error) {
    console.error("❌ Error getting trip, falling back to in-memory:", error)
    const trip = trips.find((t) => t.id === id) || null
    return trip
  }
}

export async function updateTrip(id: string, updates: Partial<Trip>): Promise<Trip | null> {
  try {
    console.log("🔄 Updating trip:", id, "with:", Object.keys(updates))

    const { db } = await connectToDatabase()

    if (db) {
      const collection: Collection<Trip> = db.collection("trips")

      // First check if trip exists
      const existingTrip = await collection.findOne({ id })
      if (!existingTrip) {
        console.error("❌ Trip not found for update:", id)
        return null
      }

      console.log("📝 Current trip status:", existingTrip.status)

      const updatedTrip = await collection.findOneAndUpdate(
        { id },
        { $set: updates },
        { returnDocument: "after", upsert: false },
      )

      if (updatedTrip) {
        console.log("✅ Trip updated in MongoDB:", id, "New status:", updatedTrip.status)
        return updatedTrip
      } else {
        console.error("❌ MongoDB update failed - no document returned")
        return null
      }
    } else {
      // Fallback to in-memory
      const index = trips.findIndex((t) => t.id === id)
      if (index === -1) {
        console.error("❌ Trip not found in memory:", id)
        return null
      }

      console.log("📝 Current trip status (memory):", trips[index].status)
      trips[index] = { ...trips[index], ...updates }
      console.log("✅ Trip updated in memory:", id, "New status:", trips[index].status)
      return trips[index]
    }
  } catch (error) {
    console.error("❌ Error updating trip, falling back to in-memory:", error)
    const index = trips.findIndex((t) => t.id === id)
    if (index === -1) return null

    trips[index] = { ...trips[index], ...updates }
    return trips[index]
  }
}

export async function getCurrentTrip(userId: string): Promise<Trip | null> {
  try {
    const { db } = await connectToDatabase()

    if (db) {
      const collection: Collection<Trip> = db.collection("trips")
      const trip = await collection.findOne({
        userId,
        status: "started",
      })
      console.log("🔍 Retrieved current trip for user from MongoDB:", userId, trip?.id)
      return trip
    } else {
      // Fallback to in-memory
      const trip = trips.find((t) => t.userId === userId && t.status === "started") || null
      console.log("🔍 Retrieved current trip for user from memory:", userId, trip?.id)
      return trip
    }
  } catch (error) {
    console.error("❌ Error getting current trip, falling back to in-memory:", error)
    const trip = trips.find((t) => t.userId === userId && t.status === "started") || null
    return trip
  }
}

export async function getUser(id: string): Promise<User | null> {
  try {
    const { db } = await connectToDatabase()

    if (db) {
      const collection: Collection<User> = db.collection("users")
      const user = await collection.findOne({ id })

      // Create user if doesn't exist
      if (!user) {
        const newUser: User = {
          id,
          name: `User ${id.slice(0, 8)}`,
          balance: 500,
        }

        const userToInsert: OptionalId<User> = { ...newUser }
        await collection.insertOne(userToInsert)
        console.log("👤 Created new user in MongoDB:", id)
        return newUser
      }

      // Convert MongoDB document to User interface (remove _id)
      const userResult: User = {
        id: user.id,
        name: user.name,
        balance: user.balance,
      }

      return userResult
    } else {
      // Fallback to in-memory
      let user = users.find((u) => u.id === id)

      if (!user) {
        user = {
          id,
          name: `User ${id.slice(0, 8)}`,
          balance: 500,
        }
        users.push({ ...user })
        console.log("👤 Created new user in memory:", id)
      }

      return user
    }
  } catch (error) {
    console.error("❌ Error getting user, falling back to in-memory:", error)
    let user = users.find((u) => u.id === id)

    if (!user) {
      user = {
        id,
        name: `User ${id.slice(0, 8)}`,
        balance: 500,
      }
      users.push({ ...user })
    }

    return user
  }
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | null> {
  try {
    console.log("💰 Updating user balance:", id, updates)

    const { db } = await connectToDatabase()

    if (db) {
      const collection: Collection<User> = db.collection("users")
      const updatedUser = await collection.findOneAndUpdate({ id }, { $set: updates }, { returnDocument: "after" })

      if (updatedUser) {
        console.log("✅ User updated in MongoDB:", id)
        // Convert MongoDB document to User interface (remove _id)
        const userResult: User = {
          id: updatedUser.id,
          name: updatedUser.name,
          balance: updatedUser.balance,
        }
        return userResult
      } else {
        console.error("❌ User update failed - no document returned")
        return null
      }
    } else {
      // Fallback to in-memory
      const index = users.findIndex((u) => u.id === id)
      if (index === -1) return null

      users[index] = { ...users[index], ...updates }
      console.log("✅ User updated in memory:", id)
      return users[index]
    }
  } catch (error) {
    console.error("❌ Error updating user, falling back to in-memory:", error)
    const index = users.findIndex((u) => u.id === id)
    if (index === -1) return null

    users[index] = { ...users[index], ...updates }
    return users[index]
  }
}

export async function getTripHistory(userId: string): Promise<Trip[]> {
  try {
    const { db } = await connectToDatabase()

    if (db) {
      const collection: Collection<Trip> = db.collection("trips")
      const tripHistory = await collection
        .find({ userId, status: "completed" })
        .sort({ endTime: -1 })
        .limit(10)
        .toArray()
      console.log("📚 Retrieved trip history from MongoDB:", userId, tripHistory.length)
      return tripHistory
    } else {
      // Fallback to in-memory
      const tripHistory = trips
        .filter((t) => t.userId === userId && t.status === "completed")
        .sort((a, b) => new Date(b.endTime || "").getTime() - new Date(a.endTime || "").getTime())
        .slice(0, 10)
      console.log("📚 Retrieved trip history from memory:", userId, tripHistory.length)
      return tripHistory
    }
  } catch (error) {
    console.error("❌ Error getting trip history, falling back to in-memory:", error)
    const tripHistory = trips
      .filter((t) => t.userId === userId && t.status === "completed")
      .sort((a, b) => new Date(b.endTime || "").getTime() - new Date(a.endTime || "").getTime())
      .slice(0, 10)
    return tripHistory
  }
}




