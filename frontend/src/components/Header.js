import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Navbar, Nav, NavDropdown, Badge, Button } from 'react-bootstrap';
import { FaShoppingCart, FaUser, FaSearch } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';

const Header = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const { user, logout } = useAuth();
  const { getCartItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    // Update cart count when cart changes
    const updateCartCount = () => {
      const items = getCartItems();
      const count = items.reduce((total, item) => total + item.quantity, 0);
      setCartCount(count);
    };

    updateCartCount();
    // Listen for cart updates
    window.addEventListener('cartUpdated', updateCartCount);
    
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
    };
  }, [getCartItems]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="sticky-top">
      <div className="container">
        <Navbar.Brand as={Link} to="/" className="fw-bold">
          🖥️ TechStore
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/">Home</Nav.Link>
            <Nav.Link as={Link} to="/products">Products</Nav.Link>
            <NavDropdown title="Categories" id="categories-dropdown">
              <NavDropdown.Item as={Link} to="/products?category=laptops">
                Laptops
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/products?category=desktops">
                Desktops
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/products?category=processors">
                Processors
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/products?category=graphics-cards">
                Graphics Cards
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/products?category=memory">
                Memory
              </NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/products?category=storage">
                Storage
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>

          {/* Search Bar */}
          <form className="d-flex me-3" onSubmit={handleSearch}>
            <div className="input-group">
              <input
                className="form-control"
                type="search"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ minWidth: '200px' }}
              />
              <Button variant="outline-light" type="submit">
                <FaSearch />
              </Button>
            </div>
          </form>

          <Nav>
            {/* Cart */}
            <Nav.Link as={Link} to="/cart" className="position-relative">
              <FaShoppingCart size={20} />
              {cartCount > 0 && (
                <Badge 
                  bg="danger" 
                  className="position-absolute top-0 start-100 translate-middle"
                  style={{ fontSize: '0.7rem' }}
                >
                  {cartCount}
                </Badge>
              )}
            </Nav.Link>

            {/* User Menu */}
            {user ? (
              <NavDropdown title={<><FaUser /> {user.fullName}</>} id="user-dropdown">
                <NavDropdown.Item as={Link} to="/profile">
                  Profile
                </NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/orders">
                  My Orders
                </NavDropdown.Item>
                {user.role === 'admin' && (
                  <NavDropdown.Item as={Link} to="/admin">
                    Admin Dashboard
                  </NavDropdown.Item>
                )}
                <NavDropdown.Divider />
                <NavDropdown.Item onClick={handleLogout}>
                  Logout
                </NavDropdown.Item>
              </NavDropdown>
            ) : (
              <Nav>
                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                <Nav.Link as={Link} to="/register">Register</Nav.Link>
              </Nav>
            )}
          </Nav>
        </Navbar.Collapse>
      </div>
    </Navbar>
  );
};

export default Header;
