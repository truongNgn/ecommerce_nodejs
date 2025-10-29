# 🛒 E-COMMERCE WEBSITE - COMPUTERS & COMPONENTS

[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.x-blue)](https://reactjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Latest-green)](https://www.mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-Latest-red)](https://redis.io/)
[![Nginx](https://img.shields.io/badge/Nginx-Alpine-green)](https://nginx.org/)

## 📋 **PROJECT OVERVIEW**

This is a comprehensive e-commerce website built for selling computers and computer components exclusively. The project is developed as a final project for the WEB PROGRAMMING WITH NODE.JS course.

### **🎯 Current Status: LEVEL 2 (Phase 1 Complete)**
- ✅ **Level 1**: Basic Docker Compose deployment
- ✅ **Level 2**: Nginx Load Balancing + Redis Queue + Backend Scaling
- 🎯 **Level 3**: Docker Swarm Orchestration (In Progress)

### **Technology Stack**
- **Backend**: Node.js + Express.js + MongoDB
- **Frontend**: React.js + Bootstrap
- **Load Balancer**: Nginx (reverse proxy & load balancing)
- **Message Queue**: Redis + Bull (async job processing)
- **Real-time**: Socket.io
- **Authentication**: JWT + Social Login (Google, Facebook)
- **Deployment**: Docker Compose (Level 2) → Docker Swarm (Level 3)

## 🚀 **QUICK START**

### **Prerequisites**
- Docker & Docker Compose (v2.0+)
- Node.js 18+ (for local development)
- 8GB RAM minimum (for running all services)

### **🎯 Option 1: Docker Compose (Recommended)**

#### **Step 1: Install Backend Dependencies**
```bash
cd backend
npm install
```

#### **Step 2: Start All Services**
```bash
cd ..
docker-compose up -d
```

This will start:
- ✅ MongoDB (database)
- ✅ Redis (message queue)
- ✅ Backend x1 (API server - scalable)
- ✅ Worker (email processor)
- ✅ Frontend (React app)
- ✅ Nginx (load balancer)

#### **Step 3: Scale Backend (Optional)**
```bash
# Scale to 3 instances for load balancing
docker-compose up -d --scale backend=3

# Scale to 5 instances
docker-compose up -d --scale backend=5
```

#### **Step 4: Access Application**
- **Frontend**: http://localhost
- **Backend API**: http://localhost/api
- **Nginx Status**: http://localhost:8080/nginx_status

#### **Step 5: Monitor Services**
```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f nginx
docker-compose logs -f backend
docker-compose logs -f worker

# Check status
docker-compose ps
```

### **🔧 Option 2: Local Development**

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ecommerce-project
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   cp env.example .env
   # Edit .env with your configuration
   npm run dev
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```

4. **Database Setup**
   - Ensure MongoDB is running on localhost:27017
   - The application will create the database automatically

5. **Admin account**
   - admin@ecommerce.com
   - admin123
5. **User account**
   - john@example.com
   - password123

### **Docker Deployment**

1. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

2. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

## 🏗️ **PROJECT STRUCTURE**

```
ecommerce-project/
├── backend/                 # Node.js + Express.js API
│   ├── src/
│   │   ├── controllers/    # Business logic
│   │   ├── models/         # Database schemas
│   │   ├── routes/         # API endpoints
│   │   ├── middleware/     # Auth, validation, error handling
│   │   └── services/       # External services
│   ├── uploads/            # File storage
│   ├── tests/             # Backend tests
│   ├── package.json
│   ├── server.js
│   └── env.example
├── frontend/               # React.js application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/         # Route components
│   │   ├── services/      # API calls
│   │   ├── utils/         # Helper functions
│   │   └── styles/        # CSS files
│   ├── public/            # Static assets
│   └── package.json
├── docker/                # Containerization files
├── docker-compose.yml     # Multi-container orchestration
└── README.md
```

## 🎯 **KEY FEATURES**

### **Customer Features (24 features)**
- ✅ User authentication (JWT + Social login)
- ✅ Product browsing with pagination
- ✅ Advanced search and filtering
- ✅ Shopping cart with real-time updates
- ✅ Guest checkout
- ✅ Order tracking and history
- ✅ Product reviews and ratings
- ✅ Loyalty points system
- ✅ Discount codes
- ✅ Email notifications

### **Admin Features (7 features)**
- ✅ Product management (CRUD)
- ✅ User management
- ✅ Order management
- ✅ Dashboard with analytics
- ✅ Discount code management
- ✅ Advanced reporting

### **Technical Features**
- ✅ Real-time updates (WebSocket)
- ✅ Responsive design
- ✅ Security best practices
- ✅ Error handling
- ✅ Performance optimization
- ✅ Docker containerization

## 🔧 **API ENDPOINTS**

### **Authentication**
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Password recovery

### **Products**
- `GET /api/products` - Get products with pagination/filtering
- `GET /api/products/:id` - Get single product
- `GET /api/products/search` - Search products

### **Cart & Orders**
- `GET /api/cart` - Get user cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/orders` - Create order
- `GET /api/orders` - Get user orders

### **Admin**
- `GET /api/admin/dashboard` - Admin dashboard data
- `GET /api/admin/users` - Get all users
- `GET /api/admin/orders` - Get all orders
- `POST /api/admin/products` - Create product

## 🛡️ **SECURITY FEATURES**

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection

## 📊 **ENVIRONMENT VARIABLES**

### **Backend (.env)**
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ecommerce
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### **Frontend**
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

## 🧪 **TESTING**

### **Backend Tests**
```bash
cd backend
npm test
```

### **Frontend Tests**
```bash
cd frontend
npm test
```

## 🚀 **DEPLOYMENT**

### **Docker Compose (Recommended)**
```bash
docker-compose up -d
```

### **Manual Deployment**
1. Set up MongoDB
2. Configure environment variables
3. Install dependencies
4. Build frontend
5. Start backend server

## 📱 **RESPONSIVE DESIGN**

The application is fully responsive and optimized for:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (320px - 767px)

## 🔄 **REAL-TIME FEATURES**

- Live cart updates
- Real-time review updates
- Order status notifications
- Admin notifications

## 📈 **PERFORMANCE OPTIMIZATION**

- Database indexing
- Image optimization
- Code splitting
- Caching strategies
- CDN integration

## 🤝 **CONTRIBUTING**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **LICENSE**

This project is licensed under the MIT License.

## 📞 **SUPPORT**

For support and questions, please contact the development team.

---

**Note**: This project is developed exclusively for educational purposes as part of the WEB PROGRAMMING WITH NODE.JS course. The website only sells computers and computer components as per project requirements.
