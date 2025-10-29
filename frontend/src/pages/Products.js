import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Form, Button, Badge, Pagination, Alert } from 'react-bootstrap';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaSearch, FaFilter, FaSort, FaTh, FaList, FaStar } from 'react-icons/fa';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { api } from '../services/api';
import { formatPrice } from '../utils/format';

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  
  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || '-createdAt');
  const [viewMode, setViewMode] = useState('grid');
  const [page, setPage] = useState(parseInt(searchParams.get('page')) || 1);
  
  // Available options
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [sortOptions] = useState([
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: '-name', label: 'Name Z-A' },
    { value: 'price', label: 'Price Low to High' },
    { value: '-price', label: 'Price High to Low' },
    { value: '-averageRating', label: 'Highest Rated' },
    { value: 'averageRating', label: 'Lowest Rated' }
  ]);

  useEffect(() => {
    // Sync state with URL params
    const searchParam = searchParams.get('search') || '';
    const categoryParam = searchParams.get('category') || '';
    const brandParam = searchParams.get('brand') || '';
    const minPriceParam = searchParams.get('minPrice') || '';
    const maxPriceParam = searchParams.get('maxPrice') || '';
    const sortParam = searchParams.get('sort') || '-createdAt';
    const pageParam = parseInt(searchParams.get('page')) || 1;
    
    // Only update state if values are different to prevent infinite loops
    if (search !== searchParam) setSearch(searchParam);
    if (category !== categoryParam) setCategory(categoryParam);
    if (brand !== brandParam) setBrand(brandParam);
    if (minPrice !== minPriceParam) setMinPrice(minPriceParam);
    if (maxPrice !== maxPriceParam) setMaxPrice(maxPriceParam);
    if (sortBy !== sortParam) setSortBy(sortParam);
    if (page !== pageParam) setPage(pageParam);
    
    loadProducts();
    loadFilters();
  }, [searchParams]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current values from URL params to ensure consistency
      const currentSearch = searchParams.get('search') || '';
      const currentCategory = searchParams.get('category') || '';
      const currentBrand = searchParams.get('brand') || '';
      const currentMinPrice = searchParams.get('minPrice') || '';
      const currentMaxPrice = searchParams.get('maxPrice') || '';
      const currentSort = searchParams.get('sort') || '-createdAt';
      const currentPage = parseInt(searchParams.get('page')) || 1;
      
      const params = {
        page: currentPage,
        limit: 12,
        search: currentSearch || undefined,
        category: currentCategory || undefined,
        brand: currentBrand || undefined,
        minPrice: currentMinPrice || undefined,
        maxPrice: currentMaxPrice || undefined,
        sort: currentSort
      };
      
      // Remove undefined values
      Object.keys(params).forEach(key => {
        if (params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      console.log('🔍 Loading products with params:', params);
      
      const response = await api.get('/products', { params });
      setProducts(response.data.data);
      setPagination(response.data.pagination || {});
      
    } catch (error) {
      console.error('Failed to load products:', error);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  const loadFilters = async () => {
    try {
      const [categoriesRes, brandsRes] = await Promise.all([
        api.get('/products/categories'),
        api.get('/products/brands')
      ]);
      
      // Extract categories array from response
      setCategories(categoriesRes.data.data?.categories || []);
      // Extract brands array from response
      setBrands(brandsRes.data.data?.brands || []);
    } catch (error) {
      console.error('Failed to load filters:', error);
    }
  };

  // Debounced search function
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId;
      return (searchValue) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          updateURL({ 
            search: searchValue, 
            category,
            brand,
            minPrice,
            maxPrice,
            sort: sortBy,
            page: 1 
          });
        }, 500); // 500ms delay
      };
    })(),
    [category, brand, minPrice, maxPrice, sortBy]
  );

  const handleSearch = (e) => {
    e.preventDefault();
    // Preserve all filters, only update search and reset page
    updateURL({ 
      search, 
      category,
      brand,
      minPrice,
      maxPrice,
      sort: sortBy,
      page: 1 
    });
  };

  const handleSearchInputChange = (value) => {
    setSearch(value);
    debouncedSearch(value);
  };

  const handleFilterChange = (filterName, value) => {
    // Update state first
    switch (filterName) {
      case 'search':
        setSearch(value);
        break;
      case 'category':
        setCategory(value);
        break;
      case 'brand':
        setBrand(value);
        break;
      case 'minPrice':
        setMinPrice(value);
        break;
      case 'maxPrice':
        setMaxPrice(value);
        break;
      case 'sort':
        setSortBy(value);
        break;
      default:
        break;
    }
    
    // Preserve all current filters, only update the changed one
    const newFilters = {
      search: filterName === 'search' ? value : search,
      category: filterName === 'category' ? value : category,
      brand: filterName === 'brand' ? value : brand,
      minPrice: filterName === 'minPrice' ? value : minPrice,
      maxPrice: filterName === 'maxPrice' ? value : maxPrice,
      sort: filterName === 'sort' ? value : sortBy,
      page: 1
    };
    updateURL(newFilters);
  };

  const handleSortChange = (value) => {
    setSortBy(value);
    // Preserve all filters when changing sort
    updateURL({ 
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sort: value, 
      page: 1 
    });
  };

  const handlePageChange = (newPage) => {
    setPage(newPage);
    // Preserve all filters when changing page
    updateURL({ 
      search,
      category,
      brand,
      minPrice,
      maxPrice,
      sort: sortBy,
      page: newPage 
    });
  };

  const updateURL = (updates) => {
    const newParams = new URLSearchParams(searchParams);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value && value !== '') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
    });
    
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearch('');
    setCategory('');
    setBrand('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('-createdAt');
    setPage(1);
    navigate('/products');
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (search) count++;
    if (category) count++;
    if (brand) count++;
    if (minPrice) count++;
    if (maxPrice) count++;
    return count;
  };

  if (loading) {
    return <LoadingSpinner message="Loading products..." />;
  }

  return (
    <Container className="py-4">
      <Row>
        {/* Filters Sidebar */}
        <Col md={3} className="mb-4">
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <FaFilter className="me-2" />
                Filters
              </h6>
              {getActiveFiltersCount() > 0 && (
                <Button 
                  variant="outline-danger" 
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear All
                </Button>
              )}
            </Card.Header>
            <Card.Body>
              {/* Search */}
              <div className="mb-4">
                <label className="form-label fw-bold">Search</label>
                <Form onSubmit={handleSearch}>
                  <div className="input-group">
                    <Form.Control
                      type="text"
                      placeholder="Search products..."
                      value={search}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                    />
                    <Button type="submit" variant="outline-secondary">
                      <FaSearch />
                    </Button>
                  </div>
                </Form>
              </div>

              {/* Category Filter */}
              <div className="mb-4">
                <label className="form-label fw-bold">Category</label>
                <Form.Select
                  value={category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Brand Filter */}
              <div className="mb-4">
                <label className="form-label fw-bold">Brand</label>
                <Form.Select
                  value={brand}
                  onChange={(e) => handleFilterChange('brand', e.target.value)}
                >
                  <option value="">All Brands</option>
                  {brands.map((brandItem) => (
                    <option key={brandItem} value={brandItem}>
                      {brandItem}
                    </option>
                  ))}
                </Form.Select>
              </div>

              {/* Price Range */}
              <div className="mb-4">
                <label className="form-label fw-bold">Price Range</label>
                <div className="row g-2">
                  <div className="col-6">
                    <Form.Control
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      onBlur={() => handleFilterChange('minPrice', minPrice)}
                    />
                  </div>
                  <div className="col-6">
                    <Form.Control
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      onBlur={() => handleFilterChange('maxPrice', maxPrice)}
                    />
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div className="mb-4">
                <label className="form-label fw-bold">
                  <FaSort className="me-2" />
                  Sort By
                </label>
                <Form.Select
                  value={sortBy}
                  onChange={(e) => handleSortChange(e.target.value)}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </div>
            </Card.Body>
          </Card>
        </Col>

        {/* Products Section */}
        <Col md={9}>
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="fw-bold mb-1">
                {category ? `${category} Products` : 'All Products'}
              </h2>
              <p className="text-muted mb-0">
                {pagination.total || 0} products found
                {getActiveFiltersCount() > 0 && (
                  <Badge bg="primary" className="ms-2">
                    {getActiveFiltersCount()} filters active
                  </Badge>
                )}
              </p>
            </div>
            
            <div className="d-flex align-items-center gap-3">
              {/* View Mode Toggle */}
              <div className="btn-group" role="group">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  <FaTh />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'outline-secondary'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                >
                  <FaList />
                </Button>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
              <Button 
                variant="outline-danger" 
                size="sm" 
                className="ms-3"
                onClick={loadProducts}
              >
                Try Again
              </Button>
            </Alert>
          )}

          {/* Products Grid/List */}
          {products.length === 0 ? (
            <Card className="text-center py-5">
              <Card.Body>
                <h4 className="text-muted">No products found</h4>
                <p className="text-muted">
                  Try adjusting your filters or search terms
                </p>
                <Button variant="primary" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </Card.Body>
            </Card>
          ) : (
            <>
              <Row className={viewMode === 'grid' ? 'g-4' : 'g-3'}>
                {products.map((product) => (
                  <Col 
                    key={product._id} 
                    md={viewMode === 'grid' ? 6 : 12}
                    lg={viewMode === 'grid' ? 4 : 12}
                  >
                    <ProductCard 
                      product={product} 
                      viewMode={viewMode}
                    />
                  </Col>
                ))}
              </Row>

              {/* Pagination - Always show, even with 1 page */}
              {!loading && products.length > 0 && (
                <div className="d-flex justify-content-center mt-5">
                  <Pagination>
                    <Pagination.Prev 
                      disabled={!pagination.hasPrevPage}
                      onClick={() => pagination.hasPrevPage && handlePageChange(pagination.prevPage)}
                    />
                    
                    {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1)
                      .filter(pageNum => {
                        const current = pagination.currentPage || 1;
                        const total = pagination.totalPages || 1;
                        return pageNum === 1 || pageNum === total || Math.abs(pageNum - current) <= 2;
                      })
                      .map((pageNum, index, array) => (
                        <React.Fragment key={pageNum}>
                          {index > 0 && array[index - 1] !== pageNum - 1 && (
                            <Pagination.Ellipsis />
                          )}
                          <Pagination.Item
                            active={pageNum === (pagination.currentPage || 1)}
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Pagination.Item>
                        </React.Fragment>
                      ))
                    }
                    
                    <Pagination.Next 
                      disabled={!pagination.hasNextPage}
                      onClick={() => pagination.hasNextPage && handlePageChange(pagination.nextPage)}
                    />
                  </Pagination>
                </div>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Products;
