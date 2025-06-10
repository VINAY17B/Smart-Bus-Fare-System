import { NextResponse } from "next/server"
import { MongoClient } from "mongodb"

export async function GET() {
  try {
    const uri = process.env.MONGODB_URI
    if (!uri) {
      return NextResponse.json({ error: "MONGODB_URI not set" }, { status: 500 })
    }

    const client = new MongoClient(uri)
    await client.connect()

    const db = client.db("smart_bus_fare")

    // Test collections
    const collections = await db.listCollections().toArray()
    console.log("Available collections:", collections)

    // Test trips collection
    const trips = db.collection("trips")
    const tripCount = await trips.countDocuments()
    const allTrips = await trips.find({}).toArray()

    // Test users collection
    const users = db.collection("users")
    const userCount = await users.countDocuments()

    await client.close()

    return NextResponse.json({
      success: true,
      collections: collections.map((c) => c.name),
      tripCount,
      userCount,
      allTrips: allTrips.map((t) => ({ id: t.id, status: t.status, userId: t.userId })),
    })
  } catch (error) {
    console.error("Database test error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
