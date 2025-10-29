const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Order = require('./src/models/Order');
const Review = require('./src/models/Review');
const DiscountCode = require('./src/models/DiscountCode');
const Cart = require('./src/models/Cart');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearData = async () => {
  try {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Review.deleteMany({});
    await DiscountCode.deleteMany({});
    await Cart.deleteMany({});
    console.log('Existing data cleared');
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};

// Create sample users
const createUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash('password123', 12);
    
    const users = [
      {
        fullName: 'Admin User',
        email: 'admin@ecommerce.com',
        password: hashedPassword,
        phone: '0123456789',
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
        addresses: [{
          type: 'default',
          fullName: 'Admin User',
          street: '123 Admin Street',
          city: 'Ho Chi Minh City',
          state: 'Ho Chi Minh',
          zipCode: '700000',
          country: 'Vietnam',
          phone: '0123456789',
          isDefault: true
        }],
        loyaltyPoints: 1000
      },
      {
        fullName: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        phone: '0987654321',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        addresses: [{
          type: 'default',
          fullName: 'John Doe',
          street: '456 Customer Street',
          city: 'Ha Noi',
          state: 'Ha Noi',
          zipCode: '100000',
          country: 'Vietnam',
          phone: '0987654321',
          isDefault: true
        }],
        loyaltyPoints: 500
      },
      {
        fullName: 'Jane Smith',
        email: 'jane@example.com',
        password: hashedPassword,
        phone: '0555666777',
        role: 'customer',
        isActive: true,
        isEmailVerified: true,
        addresses: [{
          type: 'default',
          fullName: 'Jane Smith',
          street: '789 User Avenue',
          city: 'Da Nang',
          state: 'Da Nang',
          zipCode: '500000',
          country: 'Vietnam',
          phone: '0555666777',
          isDefault: true
        }],
        loyaltyPoints: 250
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`${createdUsers.length} users created`);
    return createdUsers;
  } catch (error) {
    console.error('Error creating users:', error);
    return [];
  }
};

// Create sample products
const createProducts = async (adminUser) => {
  try {
    const products = [
      // Laptops
      {
        name: 'MacBook Pro 16-inch M2 Pro',
        slug: 'macbook-pro-16-inch-m2-pro',
        description: 'Powerful laptop with M2 Pro chip, perfect for professionals and creators. Features stunning 16.2-inch Liquid Retina XDR display, up to 22 hours of battery life, and incredible performance for demanding tasks.',
        shortDescription: 'M2 Pro chip, 16-inch display, professional laptop',
        brand: 'Apple',
        category: 'laptops',
        basePrice: 45990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/000000/FFFFFF?text=MacBook+Pro+16', alt: 'MacBook Pro 16-inch' }
        ],
        specifications: {
          'Processor': 'Apple M2 Pro',
          'RAM': '16GB',
          'Storage': '512GB SSD',
          'Display': '16.2-inch Liquid Retina XDR',
          'Graphics': '19-core GPU',
          'Battery': 'Up to 22 hours',
          'Weight': '2.15 kg'
        },
        variants: [
          {
            name: '16GB RAM, 512GB SSD',
            price: 45990000,
            stock: 10,
            sku: 'MBP16-M2-16-512',
            attributes: {
              'RAM': '16GB',
              'Storage': '512GB SSD'
            }
          },
          {
            name: '32GB RAM, 1TB SSD',
            price: 55990000,
            stock: 5,
            sku: 'MBP16-M2-32-1TB',
            attributes: {
              'RAM': '32GB',
              'Storage': '1TB SSD'
            }
          }
        ],
        totalStock: 15,
        salesCount: 45,
        isActive: true,
        isFeatured: true,
        isNew: true,
        tags: ['laptop', 'apple', 'professional', 'm2-pro']
      },
      {
        name: 'Dell XPS 13 Plus',
        slug: 'dell-xps-13-plus',
        description: 'Ultra-thin laptop with stunning 13.4-inch OLED display and premium build quality. Perfect for professionals who need portability without compromising performance.',
        shortDescription: 'Ultra-thin, OLED display, premium build',
        brand: 'Dell',
        category: 'laptops',
        basePrice: 25990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/0066CC/FFFFFF?text=Dell+XPS+13', alt: 'Dell XPS 13 Plus' }
        ],
        specifications: {
          'Processor': 'Intel Core i7-1260P',
          'RAM': '16GB',
          'Storage': '512GB SSD',
          'Display': '13.4-inch OLED 3.5K',
          'Graphics': 'Intel Iris Xe',
          'Battery': 'Up to 12 hours',
          'Weight': '1.26 kg'
        },
        variants: [
          {
            name: '16GB RAM, 512GB SSD',
            price: 25990000,
            stock: 8,
            sku: 'XPS13-16-512',
            attributes: {
              'RAM': '16GB',
              'Storage': '512GB SSD'
            }
          }
        ],
        totalStock: 8,
        salesCount: 32,
        isActive: true,
        isFeatured: true,
        isNew: true,
        tags: ['laptop', 'dell', 'ultrabook', 'oled']
      },
      // Desktop PCs
      {
        name: 'Gaming PC RTX 4080',
        slug: 'gaming-pc-rtx-4080',
        description: 'High-performance gaming desktop with RTX 4080 graphics card for ultimate gaming experience. Built with premium components for maximum performance.',
        shortDescription: 'Gaming desktop, RTX 4080, high performance',
        brand: 'Custom Build',
        category: 'desktops',
        basePrice: 35990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Gaming+PC+RTX+4080', alt: 'Gaming PC RTX 4080' }
        ],
        specifications: {
          'Processor': 'Intel Core i7-13700K',
          'RAM': '32GB DDR5',
          'Storage': '1TB NVMe SSD',
          'Graphics': 'NVIDIA RTX 4080',
          'Power Supply': '850W 80+ Gold',
          'Case': 'ATX Mid Tower',
          'Cooling': 'Liquid Cooling'
        },
        variants: [
          {
            name: 'RTX 4080, 32GB RAM',
            price: 35990000,
            stock: 3,
            sku: 'GPC-RTX4080-32GB',
            attributes: {
              'Graphics': 'RTX 4080',
              'RAM': '32GB'
            }
          }
        ],
        totalStock: 3,
        salesCount: 28,
        isActive: true,
        isFeatured: true,
        tags: ['gaming', 'desktop', 'rtx-4080', 'high-performance']
      },
      // Graphics Cards
      {
        name: 'NVIDIA GeForce RTX 4090',
        slug: 'nvidia-geforce-rtx-4090',
        description: 'The ultimate graphics card for gaming and content creation with 24GB GDDR6X memory. Delivers incredible performance for 4K gaming and professional workloads.',
        shortDescription: 'RTX 4090, 24GB VRAM, ultimate performance',
        brand: 'NVIDIA',
        category: 'graphics-cards',
        basePrice: 45990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/00FF00/FFFFFF?text=RTX+4090', alt: 'NVIDIA RTX 4090' }
        ],
        specifications: {
          'Memory': '24GB GDDR6X',
          'Memory Bus': '384-bit',
          'Base Clock': '2230 MHz',
          'Boost Clock': '2520 MHz',
          'CUDA Cores': '16384',
          'RT Cores': '3rd Gen',
          'Tensor Cores': '4th Gen',
          'Power Consumption': '450W'
        },
        variants: [
          {
            name: 'Founders Edition',
            price: 45990000,
            stock: 2,
            sku: 'RTX4090-FE',
            attributes: {
              'Edition': 'Founders Edition'
            }
          }
        ],
        totalStock: 2,
        salesCount: 38,
        isActive: true,
        isFeatured: true,
        isNew: true,
        tags: ['graphics-card', 'rtx-4090', 'gaming', 'content-creation']
      },
      {
        name: 'AMD Radeon RX 7900 XTX',
        slug: 'amd-radeon-rx-7900-xtx',
        description: 'High-performance AMD graphics card with 24GB GDDR6 memory for gaming and productivity. Excellent value for high-end gaming.',
        shortDescription: 'RX 7900 XTX, 24GB VRAM, AMD performance',
        brand: 'AMD',
        category: 'graphics-cards',
        basePrice: 25990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/FF0000/FFFFFF?text=RX+7900+XTX', alt: 'AMD RX 7900 XTX' }
        ],
        specifications: {
          'Memory': '24GB GDDR6',
          'Memory Bus': '384-bit',
          'Base Clock': '1900 MHz',
          'Boost Clock': '2500 MHz',
          'Compute Units': '96',
          'Ray Accelerators': '96',
          'Power Consumption': '355W'
        },
        variants: [
          {
            name: 'Reference Design',
            price: 25990000,
            stock: 4,
            sku: 'RX7900XTX-REF',
            attributes: {
              'Design': 'Reference'
            }
          }
        ],
        totalStock: 4,
        salesCount: 22,
        isActive: true,
        isFeatured: false,
        tags: ['graphics-card', 'amd', 'rx-7900-xtx', 'gaming']
      },
      // Processors
      {
        name: 'Intel Core i9-13900K',
        slug: 'intel-core-i9-13900k',
        description: 'High-performance desktop processor with 24 cores and 32 threads for demanding workloads. Perfect for gaming, content creation, and professional applications.',
        shortDescription: 'i9-13900K, 24 cores, high performance',
        brand: 'Intel',
        category: 'processors',
        basePrice: 15990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/0066CC/FFFFFF?text=Intel+i9-13900K', alt: 'Intel Core i9-13900K' }
        ],
        specifications: {
          'Cores': '24 (8P + 16E)',
          'Threads': '32',
          'Base Clock': '3.0 GHz',
          'Boost Clock': '5.8 GHz',
          'Cache': '36MB L3',
          'TDP': '125W',
          'Socket': 'LGA 1700'
        },
        variants: [
          {
            name: 'Boxed',
            price: 15990000,
            stock: 6,
            sku: 'I9-13900K-BOX',
            attributes: {
              'Package': 'Boxed'
            }
          }
        ],
        totalStock: 6,
        salesCount: 42,
        isActive: true,
        isFeatured: true,
        isNew: true,
        tags: ['processor', 'intel', 'i9', 'high-performance']
      },
      {
        name: 'AMD Ryzen 9 7950X',
        slug: 'amd-ryzen-9-7950x',
        description: 'Flagship AMD processor with 16 cores and 32 threads, perfect for content creation and professional workloads. Excellent performance per dollar.',
        shortDescription: 'Ryzen 9 7950X, 16 cores, content creation',
        brand: 'AMD',
        category: 'processors',
        basePrice: 12990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/FF0000/FFFFFF?text=Ryzen+9+7950X', alt: 'AMD Ryzen 9 7950X' }
        ],
        specifications: {
          'Cores': '16',
          'Threads': '32',
          'Base Clock': '4.5 GHz',
          'Boost Clock': '5.7 GHz',
          'Cache': '80MB Total',
          'TDP': '170W',
          'Socket': 'AM5'
        },
        variants: [
          {
            name: 'Boxed',
            price: 12990000,
            stock: 5,
            sku: 'R9-7950X-BOX',
            attributes: {
              'Package': 'Boxed'
            }
          }
        ],
        totalStock: 5,
        salesCount: 35,
        isActive: true,
        isFeatured: false,
        tags: ['processor', 'amd', 'ryzen-9', 'content-creation']
      },
      // Memory
      {
        name: 'Corsair Vengeance RGB 32GB DDR5-5600',
        slug: 'corsair-vengeance-rgb-32gb-ddr5-5600',
        description: 'High-performance DDR5 memory with RGB lighting and excellent overclocking potential. Perfect for gaming and content creation systems.',
        shortDescription: '32GB DDR5-5600, RGB, high performance',
        brand: 'Corsair',
        category: 'memory',
        basePrice: 3990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/800080/FFFFFF?text=Corsair+32GB+DDR5', alt: 'Corsair Vengeance RGB 32GB' }
        ],
        specifications: {
          'Capacity': '32GB (2x16GB)',
          'Speed': 'DDR5-5600',
          'Timings': 'CL36',
          'Voltage': '1.25V',
          'Form Factor': 'DIMM',
          'Color': 'Black',
          'Lighting': 'RGB'
        },
        variants: [
          {
            name: '32GB Kit (2x16GB)',
            price: 3990000,
            stock: 12,
            sku: 'COR-32GB-DDR5-5600',
            attributes: {
              'Capacity': '32GB Kit'
            }
          }
        ],
        totalStock: 12,
        salesCount: 18,
        isActive: true,
        isFeatured: false,
        isNew: true,
        tags: ['memory', 'ddr5', 'rgb', 'corsair']
      },
      // Storage
      {
        name: 'Samsung 980 PRO 2TB NVMe SSD',
        slug: 'samsung-980-pro-2tb-nvme-ssd',
        description: 'High-speed NVMe SSD with 2TB capacity, perfect for gaming and content creation. Features PCIe 4.0 interface for maximum performance.',
        shortDescription: '2TB NVMe SSD, high speed, Samsung',
        brand: 'Samsung',
        category: 'storage',
        basePrice: 5990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/000000/FFFFFF?text=Samsung+980+PRO+2TB', alt: 'Samsung 980 PRO 2TB' }
        ],
        specifications: {
          'Capacity': '2TB',
          'Interface': 'PCIe 4.0 x4 NVMe',
          'Sequential Read': '7000 MB/s',
          'Sequential Write': '5000 MB/s',
          'Random Read': '1000K IOPS',
          'Random Write': '1000K IOPS',
          'Form Factor': 'M.2 2280'
        },
        variants: [
          {
            name: '2TB',
            price: 5990000,
            stock: 8,
            sku: 'SAM-980PRO-2TB',
            attributes: {
              'Capacity': '2TB'
            }
          }
        ],
        totalStock: 8,
        salesCount: 52,
        isActive: true,
        isFeatured: true,
        tags: ['ssd', 'nvme', 'samsung', 'high-speed']
      },
      // Accessories
      {
        name: 'Logitech MX Master 3S Wireless Mouse',
        slug: 'logitech-mx-master-3s-wireless-mouse',
        description: 'Premium wireless mouse with advanced tracking and ergonomic design for productivity. Features 70-day battery life and multi-device connectivity.',
        shortDescription: 'Wireless mouse, ergonomic, productivity',
        brand: 'Logitech',
        category: 'accessories',
        basePrice: 2990000,
        createdBy: adminUser._id,
        images: [
          { url: 'https://via.placeholder.com/600x400/00AA00/FFFFFF?text=Logitech+MX+Master+3S', alt: 'Logitech MX Master 3S' }
        ],
        specifications: {
          'Connectivity': 'Bluetooth, USB-C',
          'Sensor': 'Darkfield 8000 DPI',
          'Battery Life': '70 days',
          'Buttons': '7 programmable',
          'Scroll': 'MagSpeed electromagnetic',
          'Compatibility': 'Windows, macOS, Linux'
        },
        variants: [
          {
            name: 'Graphite',
            price: 2990000,
            stock: 15,
            sku: 'LOG-MX3S-GRAPHITE',
            attributes: {
              'Color': 'Graphite'
            }
          },
          {
            name: 'Pale Grey',
            price: 2990000,
            stock: 10,
            sku: 'LOG-MX3S-PALE',
            attributes: {
              'Color': 'Pale Grey'
            }
          }
        ],
        totalStock: 25,
        salesCount: 15,
        isActive: true,
        isFeatured: false,
        tags: ['mouse', 'wireless', 'logitech', 'productivity']
      }
    ];

    const createdProducts = await Product.insertMany(products);
    console.log(`${createdProducts.length} products created`);
    return createdProducts;
  } catch (error) {
    console.error('Error creating products:', error);
    return [];
  }
};

// Create sample orders
const createOrders = async (users, products) => {
  try {
    const orders = [
      {
        user: users[1]._id, // John Doe
        orderNumber: 'ORD-001',
        items: [
          {
            product: products[0]._id, // MacBook Pro
            variant: products[0].variants[0]._id,
            quantity: 1,
            price: 45990000
          },
          {
            product: products[8]._id, // Samsung SSD
            variant: products[8].variants[0]._id,
            quantity: 1,
            price: 5990000
          }
        ],
        shippingAddress: {
          fullName: 'John Doe',
          street: '456 Customer Street',
          city: 'Ha Noi',
          state: 'Ha Noi',
          zipCode: '100000',
          country: 'Vietnam',
          phone: '0987654321'
        },
        paymentMethod: 'credit_card',
        paymentStatus: 'paid',
        status: 'delivered',
        subtotal: 51980000,
        shippingCost: 500000,
        taxAmount: 5198000,
        total: 57678000,
        statusHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          { status: 'confirmed', timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000) },
          { status: 'shipped', timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
          { status: 'delivered', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        ]
      },
      {
        user: users[2]._id, // Jane Smith
        orderNumber: 'ORD-002',
        items: [
          {
            product: products[2]._id, // Gaming PC
            variant: products[2].variants[0]._id,
            quantity: 1,
            price: 35990000
          }
        ],
        shippingAddress: {
          fullName: 'Jane Smith',
          street: '789 User Avenue',
          city: 'Da Nang',
          state: 'Da Nang',
          zipCode: '500000',
          country: 'Vietnam',
          phone: '0555666777'
        },
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        status: 'shipped',
        subtotal: 35990000,
        shippingCost: 800000,
        taxAmount: 3599000,
        total: 40389000,
        statusHistory: [
          { status: 'pending', timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
          { status: 'confirmed', timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
          { status: 'shipped', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
        ]
      }
    ];

    const createdOrders = await Order.insertMany(orders);
    console.log(`${createdOrders.length} orders created`);
    return createdOrders;
  } catch (error) {
    console.error('Error creating orders:', error);
    return [];
  }
};

// Create sample reviews
const createReviews = async (users, products) => {
  try {
    const reviews = [
      {
        user: users[1]._id, // John Doe
        product: products[0]._id, // MacBook Pro
        rating: 5,
        title: 'Excellent laptop!',
        comment: 'The MacBook Pro is amazing. Great performance and build quality.',
        isVerified: true
      },
      {
        user: users[2]._id, // Jane Smith
        product: products[0]._id, // MacBook Pro
        rating: 4,
        title: 'Very good, but expensive',
        comment: 'Great laptop but quite expensive. Performance is excellent though.',
        isVerified: true
      },
      {
        user: users[1]._id, // John Doe
        product: products[3]._id, // RTX 4090
        rating: 5,
        title: 'Incredible performance!',
        comment: 'This graphics card is a beast. Handles everything at 4K with ease.',
        isVerified: true
      }
    ];

    const createdReviews = await Review.insertMany(reviews);
    console.log(`${createdReviews.length} reviews created`);
    return createdReviews;
  } catch (error) {
    console.error('Error creating reviews:', error);
    return [];
  }
};

// Create sample discount codes
const createDiscountCodes = async (adminUser) => {
  try {
    const discountCodes = [
      {
        code: 'WELCOME',
        description: 'Welcome discount for new customers',
        type: 'percentage',
        discountValue: 10,
        minOrderAmount: 1000000,
        maxDiscountAmount: 5000000,
        maxUses: 100,
        usedCount: 5,
        createdBy: adminUser._id,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'SAVE50',
        description: 'Fixed discount for orders over 5M',
        type: 'fixed',
        discountValue: 500000,
        minOrderAmount: 5000000,
        maxDiscountAmount: 500000,
        maxUses: 50,
        usedCount: 2,
        createdBy: adminUser._id,
        isActive: true,
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      },
      {
        code: 'GAME20',
        description: 'Gaming products discount',
        type: 'percentage',
        discountValue: 20,
        minOrderAmount: 2000000,
        maxDiscountAmount: 10000000,
        maxUses: 30,
        usedCount: 0,
        createdBy: adminUser._id,
        isActive: true,
        applicableCategories: ['graphics-cards', 'gaming'],
        validFrom: new Date(),
        validUntil: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000)
      }
    ];

    const createdDiscountCodes = await DiscountCode.insertMany(discountCodes);
    console.log(`${createdDiscountCodes.length} discount codes created`);
    return createdDiscountCodes;
  } catch (error) {
    console.error('Error creating discount codes:', error);
    return [];
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');
    
    await connectDB();
    await clearData();
    
    const users = await createUsers();
    if (users.length === 0) {
      console.error('Failed to create users, stopping...');
      process.exit(1);
    }
    
    const products = await createProducts(users[0]); // Use admin user as creator
    if (products.length === 0) {
      console.error('Failed to create products, stopping...');
      process.exit(1);
    }
    
    const orders = await createOrders(users, products);
    const reviews = await createReviews(users, products);
    const discountCodes = await createDiscountCodes(users[0]); // Use admin user as creator
    
    console.log('Database seeding completed successfully!');
    console.log(`Created: ${users.length} users, ${products.length} products, ${orders.length} orders, ${reviews.length} reviews, ${discountCodes.length} discount codes`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();
