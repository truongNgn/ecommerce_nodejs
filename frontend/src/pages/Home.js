import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Carousel, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaStar, FaArrowRight, FaFire, FaNewspaper, FaTrophy } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { formatPrice } from '../utils/format';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newProducts, setNewProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      
      // Load featured products
      const featuredResponse = await api.get('/products/featured', {
        params: { limit: 8 }
      });
      setFeaturedProducts(featuredResponse.data.data);

      // Load new products
      const newResponse = await api.get('/products/new', {
        params: { limit: 8 }
      });
      setNewProducts(newResponse.data.data);

      // Load best sellers
      const bestSellersResponse = await api.get('/products/bestsellers', {
        params: { limit: 8 }
      });
      setBestSellers(bestSellersResponse.data.data);

      // Load categories with stats
      const categoriesResponse = await api.get('/products/categories');
      setCategories(categoriesResponse.data.data.stats || []);

    } catch (error) {
      console.error('Failed to load home data:', error);
      setError('Failed to load home data');
    } finally {
      setLoading(false);
    }
  };

  const heroSlides = [
    {
      id: 1,
      title: "Latest Gaming Laptops",
      subtitle: "Powerful performance for gamers and creators",
      image: "/hero-gaming-laptop.jpg",
      link: "/products?category=laptops",
      buttonText: "Shop Now"
    },
    {
      id: 2,
      title: "High-End Graphics Cards",
      subtitle: "Experience stunning visuals with RTX series",
      image: "/hero-graphics-card.jpg",
      link: "/products?category=graphics-cards",
      buttonText: "Explore"
    },
    {
      id: 3,
      title: "Professional Workstations",
      subtitle: "Built for professionals who demand the best",
      image: "/hero-workstation.jpg",
      link: "/products?category=desktops",
      buttonText: "Discover"
    }
  ];

  const getCategoryIcon = (categoryName) => {
    const icons = {
      'laptops': '💻',
      'desktops': '🖥️',
      'processors': '⚡',
      'graphics-cards': '🎮',
      'memory': '🧠',
      'storage': '💿',
      'accessories': '⌨️',
      'monitors': '🖥️'
    };
    return icons[categoryName] || '📦';
  };

  const getCategoryDescription = (categoryName) => {
    const descriptions = {
      'laptops': 'Gaming & Professional Laptops',
      'desktops': 'Custom & Pre-built Systems',
      'processors': 'Intel & AMD CPUs',
      'graphics-cards': 'NVIDIA & AMD GPUs',
      'memory': 'RAM & Storage Solutions',
      'storage': 'SSDs & HDDs',
      'accessories': 'Keyboards, Mice & More',
      'monitors': 'Gaming & Professional Displays'
    };
    return descriptions[categoryName] || 'Browse products';
  };

  if (loading) {
    return <LoadingSpinner message="Loading home page..." />;
  }

  const categoryCards = (categories || [])
    .filter(cat => cat && cat._id) // Filter out invalid categories
    .slice(0, 6)
    .map(cat => ({
      name: cat._id.charAt(0).toUpperCase() + cat._id.slice(1).replace(/-/g, ' '),
      icon: getCategoryIcon(cat._id),
      description: getCategoryDescription(cat._id),
      link: `/products?category=${cat._id}`,
      count: cat.count || 0
    }));

  if (error) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <h2 className="text-danger">Error Loading Home Page</h2>
          <p className="text-muted">{error}</p>
          <Button variant="primary" onClick={loadHomeData}>
            Try Again
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section mb-5">
        <Carousel fade indicators={false} controls={false}>
          {heroSlides.map((slide) => (
            <Carousel.Item key={slide.id}>
              <div 
                className="hero-slide d-flex align-items-center"
                style={{
                  backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${slide.image})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  height: '500px'
                }}
              >
                <Container>
                  <Row className="align-items-center">
                    <Col md={6}>
                      <div className="text-white">
                        <h1 className="display-4 fw-bold mb-3">{slide.title}</h1>
                        <p className="lead mb-4">{slide.subtitle}</p>
                        <Button 
                          as={Link} 
                          to={slide.link}
                          variant="primary" 
                          size="lg"
                          className="px-4 py-2"
                        >
                          {slide.buttonText}
                          <FaArrowRight className="ms-2" />
                        </Button>
                      </div>
                    </Col>
                  </Row>
                </Container>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>
      </section>

      <Container>
        {/* Categories Section */}
        <section className="categories-section mb-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold">Shop by Category</h2>
            <p className="text-muted">Find exactly what you're looking for</p>
          </div>
          
          <Row className="g-4">
            {categoryCards.map((category, index) => (
              <Col md={4} lg={2} key={index}>
                <Card 
                  as={Link} 
                  to={category.link}
                  className="h-100 text-decoration-none text-dark category-card"
                  style={{ transition: 'transform 0.2s' }}
                >
                  <Card.Body className="text-center p-4">
                    <div className="display-4 mb-3">{category.icon}</div>
                    <h6 className="fw-bold mb-2">{category.name}</h6>
                    <p className="text-muted small mb-2">{category.description}</p>
                    <Badge bg="secondary">{category.count} items</Badge>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </section>

        {/* Featured Products */}
        <section className="featured-products mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">
              <FaStar className="text-warning me-2" />
              Featured Products
            </h2>
            <Button as={Link} to="/products" variant="outline-primary">
              View All
              <FaArrowRight className="ms-2" />
            </Button>
          </div>
          
          <Row className="g-4">
            {featuredProducts.map((product) => (
              <Col md={6} lg={3} key={product._id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </section>

        {/* New Products */}
        <section className="new-products mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">
              <FaNewspaper className="text-info me-2" />
              New Arrivals
            </h2>
            <Button as={Link} to="/products?sort=-createdAt" variant="outline-primary">
              View All
              <FaArrowRight className="ms-2" />
            </Button>
          </div>
          
          <Row className="g-4">
            {newProducts.map((product) => (
              <Col md={6} lg={3} key={product._id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </section>

        {/* Best Sellers */}
        <section className="best-sellers mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold mb-0">
              <FaTrophy className="text-warning me-2" />
              Best Sellers
            </h2>
            <Button as={Link} to="/products?sort=-averageRating" variant="outline-primary">
              View All
              <FaArrowRight className="ms-2" />
            </Button>
          </div>
          
          <Row className="g-4">
            {bestSellers.map((product) => (
              <Col md={6} lg={3} key={product._id}>
                <ProductCard product={product} />
              </Col>
            ))}
          </Row>
        </section>

        {/* Newsletter Signup */}
        <section className="newsletter-section mb-5">
          <Card className="bg-primary text-white">
            <Card.Body className="text-center py-5">
              <h3 className="fw-bold mb-3">Stay Updated</h3>
              <p className="lead mb-4">
                Get the latest news about new products, special offers, and tech trends.
              </p>
              <div className="row justify-content-center">
                <div className="col-md-6">
                  <div className="input-group">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Enter your email"
                    />
                    <Button variant="light" className="px-4">
                      Subscribe
                    </Button>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </section>
      </Container>
    </div>
  );
};

export default Home;
