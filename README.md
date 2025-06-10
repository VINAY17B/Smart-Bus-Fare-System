# Smart-Bus-Fare-System

## 📋 **Project Overview**

The Smart Bus Fare System is a modern, GPS-enhanced public transportation fare management solution built with Next.js, TypeScript, and MongoDB. It combines QR code scanning with real-time GPS tracking to provide accurate distance-based fare calculations for bus journeys.

## ✨ **Key Features**

### 🎯 **Core Functionality**

- **QR Code Scanning**: Multiple input methods (camera, file upload, manual entry)
- **GPS Tracking**: Real-time location tracking during trips
- **Distance Calculation**: Accurate fare calculation based on actual travel distance
- **Trip Management**: Start/end trip functionality with complete journey history
- **Balance Management**: User wallet system with fare deduction
- **Responsive Design**: Mobile-first design optimized for smartphones


### 🛰️ **GPS Enhancement**

- **Real-time Tracking**: Continuous GPS monitoring during active trips
- **Path Recording**: Complete journey path storage with timestamps
- **Distance Accuracy**: Compares straight-line vs actual GPS distance
- **Noise Filtering**: Removes GPS noise for accurate distance calculation
- **Debug Panel**: Real-time GPS status and tracking information


### 💾 **Data Management**

- **MongoDB Integration**: Persistent data storage with fallback to in-memory
- **User Profiles**: Automatic user creation and balance management
- **Trip History**: Complete journey records with GPS data
- **Error Handling**: Comprehensive error logging and recovery


## 🏗️ **Technical Architecture**

### **Frontend Stack**

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Modern UI components
- **html5-qrcode** - QR code scanning library


### **Backend Stack**

- **Next.js API Routes** - Server-side functionality
- **MongoDB** - Primary database
- **In-memory Storage** - Development fallback
- **UUID** - Unique identifier generation


### **Key Libraries**

```json
{
  "html5-qrcode": "^2.3.8",
  "mongodb": "^6.0.0",
  "uuid": "^9.0.0",
  "lucide-react": "^0.263.1"
}
```

## 📁 **Project Structure**

```plaintext
smart-bus-fare-system/
├── app/
│   ├── api/
│   │   ├── trips/
│   │   │   ├── start/route.ts          # Start trip endpoint
│   │   │   ├── end/route.ts            # End trip endpoint
│   │   │   └── update-gps/route.ts     # GPS update endpoint
│   │   └── user/[userId]/route.ts      # User data endpoint
│   ├── qr-generator/page.tsx           # QR code generator
│   ├── test-qr/page.tsx               # Test QR codes page
│   └── page.tsx                       # Main application
├── components/
│   ├── gps-enhanced-qr-scanner.tsx    # Enhanced QR scanner
│   ├── qr-scanner.tsx                 # Basic QR scanner
│   ├── qr-generator.tsx               # QR code generator
│   └── gps-debug-panel.tsx            # GPS debugging panel
├── lib/
│   ├── data-store.ts                  # Database operations
│   ├── gps-tracker.ts                 # GPS tracking logic
│   ├── distance-utils.ts              # Distance calculations
│   └── user-utils.ts                  # User utilities
└── README.md
```

## 🚀 **Getting Started**

### **Prerequisites**

- Node.js 18+
- MongoDB (optional - has in-memory fallback)
- Modern web browser with camera support


### **Installation**

1. **Clone the repository:**


```shellscript
git clone https://github.com/yourusername/smart-bus-fare-system.git
cd smart-bus-fare-system
```

2. **Install dependencies:**


```shellscript
npm install
```

3. **Environment Setup:**
Create `.env.local` file:


```plaintext
MONGODB_URI=mongodb://localhost:27017/smart_bus_fare
# Optional - system works without MongoDB using in-memory storage
```

4. **Run the development server:**


```shellscript
npm run dev
```

5. **Open your browser:**
Navigate to `http://localhost:3000`


## 📱 **How to Use**

### **🧪 Testing Mode (Browser)**

1. **Generate QR Codes:**

1. Visit `http://localhost:3000/qr-generator`
2. Download or screenshot the test QR codes
3. Each QR contains GPS coordinates for different "bus stops"



2. **Setup GPS Simulation:**

1. Open Chrome DevTools (F12)
2. Go to **Console** → **Sensors** tab
3. Enable "Location override"
4. Set coordinates to match your first QR code



3. **Start Testing:**

1. Scan first QR code → Trip starts
2. Change GPS coordinates in DevTools
3. Watch distance increase in real-time
4. Scan second QR code → Trip ends with fare calculation





### **🌍 Live Testing (Real World)**

1. **Prepare QR Codes:**

1. Print QR codes from the generator
2. Place them at different physical locations
3. Each represents a bus stop



2. **Mobile Testing:**

1. Allow GPS permissions
2. Scan QR at starting location
3. Travel to destination (GPS tracks automatically)
4. Scan QR at ending location
5. Pay fare based on actual distance traveled





## 🔧 **API Endpoints**

### **Trip Management**

```typescript
POST /api/trips/start
Body: { userId: string, location: {lat: number, lng: number} }
Response: Trip object with GPS tracking started

POST /api/trips/end  
Body: { tripId: string, location: {lat: number, lng: number} }
Response: Completed trip with fare calculation

POST /api/trips/update-gps
Body: { tripId: string, gpsLocation: {lat: number, lng: number} }
Response: Updated trip with current distance
```

### **User Management**

```typescript
GET /api/user/[userId]
Response: User profile with balance and trip history
```

## 🎯 **Key Components**

### **GPSEnhancedQRScanner**

- Multi-modal QR scanning (camera/upload/manual)
- Real-time GPS integration
- Trip mode awareness (start/end)
- Error handling and validation


### **GPSTracker Class**

- Continuous location monitoring
- Permission management
- Error handling and recovery
- Configurable update intervals


### **Distance Utilities**

- Haversine formula for accurate distance
- GPS path distance calculation
- Noise filtering for GPS points
- Fare calculation based on distance


## 💡 **Advanced Features**

### **GPS Tracking Logic**

```typescript
// Real-time GPS updates during trip
const gpsTracker = new GPSTracker({
  onLocationUpdate: (position) => {
    updateTripGPS(tripId, position)
  },
  updateInterval: 5000 // 5 seconds
})
```

### **Distance Calculation**

```typescript
// Compare straight-line vs GPS path distance
const straightDistance = calculateDistance(start, end)
const actualDistance = calculatePathDistance(gpsPath)
const fare = calculateFare(actualDistance)
```

### **Data Persistence**

```typescript
// MongoDB with in-memory fallback
const trip = await createTrip(tripData)
// Automatically falls back to memory if MongoDB unavailable
```

## 🐛 **Debugging & Troubleshooting**

### **Common Issues**

1. **GPS Not Working:**

1. Check browser permissions
2. Ensure HTTPS in production
3. Use Chrome DevTools for testing



2. **QR Scanning Issues:**

1. Use good lighting
2. Try file upload instead of camera
3. Use manual entry as fallback



3. **Database Connection:**

1. System works without MongoDB
2. Check MONGODB_URI in environment
3. Monitor console for connection logs





### **Debug Features**

- GPS Debug Panel shows real-time tracking
- Console logging for all operations
- Error boundaries with detailed messages
- Fallback systems for reliability


## 🚀 **Deployment**

### **Vercel Deployment**

```shellscript
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
MONGODB_URI=your_mongodb_connection_string
```

### **Production Considerations**

- HTTPS required for GPS access
- MongoDB Atlas for production database
- Environment variable configuration
- Mobile browser compatibility testing


## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request


## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **html5-qrcode** - QR code scanning functionality
- **shadcn/ui** - Beautiful UI components
- **MongoDB** - Reliable data storage
- **Vercel** - Seamless deployment platform


## 📞 **Support**

For support and questions:

- Create an issue on GitHub
- Check the debugging section above
- Review console logs for detailed error information


---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**

To configure the generation, complete these steps:
