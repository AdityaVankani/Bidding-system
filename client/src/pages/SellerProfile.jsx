import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FiEdit2, FiUpload, FiDollarSign, FiClock, FiPlus, FiCheck, FiX, FiTrash2, FiEye, FiImage, FiPackage } from "react-icons/fi";
import { format } from 'date-fns';

// Format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Format date
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy h:mm a');
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

// Product Card Component
const ProductCard = ({ product, onDelete, onEdit }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative pb-2/3 h-48 bg-gray-100">
        <img
          src={product.imageUrl || '/placeholder-jewelry.jpg'}
          alt={product.title}
          className="absolute h-full w-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            {product.category || 'Jewelry'}
          </span>
        </div>
        {isHovered && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center space-x-2 transition-opacity">
            <button
              onClick={() => onEdit(product)}
              className="p-2 bg-white rounded-full text-yellow-600 hover:bg-yellow-50 transition-colors"
              title="Edit"
            >
              <FiEdit2 className="h-5 w-5" />
            </button>
            <button
              onClick={() => onDelete(product._id)}
              className="p-2 bg-white rounded-full text-red-600 hover:bg-red-50 transition-colors"
              title="Delete"
            >
              <FiTrash2 className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{product.title}</h3>
        <p className="mt-1 text-sm text-gray-500 line-clamp-2 min-h-[2.5rem]">{product.description}</p>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-yellow-700">
              {new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(product.startPrice || 0)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <FiClock className="inline mr-1" />
              {format(new Date(product.auctionEndTime), 'MMM d, yyyy h:mm a')}
            </p>
          </div>
          <button
            onClick={() => {
              // Navigate to product detail page
              // navigate(`/products/${product._id}`);
            }}
            className="text-sm font-medium text-yellow-600 hover:text-yellow-700 flex items-center"
          >
            View Details <FiEye className="ml-1 h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const SellerProfile = () => {
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('products');
  const [editMode, setEditMode] = useState(false);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    image: "",
  });
  
  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    imageUrl: "",
    startPrice: "",
    auctionEndTime: "",
    category: "ring", // Default category
  });
  
  const [message, setMessage] = useState({ text: "", type: "" });
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const [sellerRes, productsRes] = await Promise.all([
          axios.get("https://bidding-system-6vjf.onrender.com/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get("https://bidding-system-6vjf.onrender.com/api/products/my-listed", {
            headers: { Authorization: `Bearer ${token}` },
          })
        ]);

        if (sellerRes.data.role !== "seller") {
          navigate("/profile");
          return;
        }

        const sellerData = sellerRes.data;
        setSeller(sellerData);
        setFormData({
          name: sellerData.name,
          bio: sellerData.bio || "",
          image: sellerData.image || "/default-avatar.png",
        });
        
        setProducts(productsRes.data || []);
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(
          err.response?.data?.message || 
          "Failed to load profile data. Please try again later."
        );
        
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  // Handle input changes for profile form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle input changes for product form
  const handleProductInputChange = (e) => {
    const { name, value } = e.target;
    setProductForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Upload image to Cloudinary
  const handleImageUpload = async (e, isProductImage = false) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

    try {
      setLoading(true);
      const res = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData
      );

      if (isProductImage) {
        setProductForm(prev => ({
          ...prev,
          imageUrl: res.data.secure_url
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          image: res.data.secure_url
        }));
      }
      
      setMessage({ 
        text: 'Image uploaded successfully!', 
        type: 'success' 
      });
    } catch (err) {
      console.error('Error uploading image:', err);
      setMessage({ 
        text: 'Failed to upload image. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }
  };

  // Handle profile form submission
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setMessage({ 
        text: 'Name is required', 
        type: 'error' 
      });
      return;
    }

    try {
      setLoading(true);
      const res = await axios.put(
        'https://bidding-system-6vjf.onrender.com/api/user/update',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSeller(prev => ({
        ...prev,
        ...res.data,
        image: formData.image || prev.image
      }));
      
      setEditMode(false);
      setMessage({ 
        text: 'Profile updated successfully!', 
        type: 'success' 
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to update profile', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }
  };

  // Toggle add product form
  const toggleAddProduct = () => {
    setIsAddingProduct(!isAddingProduct);
    if (!isAddingProduct) {
      // Reset form when opening for new product
      setProductForm({
        title: "",
        description: "",
        imageUrl: "",
        startPrice: "",
        auctionEndTime: "",
        category: "ring",
        _id: null // No ID means it's a new product
      });
    }
  };

  // Handle adding/updating a product
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!productForm.title.trim() || !productForm.startPrice || !productForm.auctionEndTime) {
      setMessage({ 
        text: 'Please fill in all required fields', 
        type: 'error' 
      });
      return;
    }

    // Validate price is a positive number
    const price = parseFloat(productForm.startPrice);
    if (isNaN(price) || price <= 0) {
      setMessage({ 
        text: 'Please enter a valid price', 
        type: 'error' 
      });
      return;
    }

    // Validate end date is in the future
    const endDate = new Date(productForm.auctionEndTime);
    if (endDate <= new Date()) {
      setMessage({ 
        text: 'Auction end time must be in the future', 
        type: 'error' 
      });
      return;
    }

    // Prepare product data
    const productData = {
      title: productForm.title.trim(),
      description: productForm.description.trim(),
      imageUrl: productForm.imageUrl,
      startPrice: price,
      auctionEndTime: endDate.toISOString(),
      category: productForm.category
    };

    try {
      setLoading(true);
      
      if (productForm._id) {
        // Update existing product
        const res = await axios.put(
          `https://bidding-system-6vjf.onrender.com/api/products/${productForm._id}`,
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Update the products list with the updated product
        setProducts(prev => 
          prev.map(p => p._id === productForm._id ? res.data : p)
        );
        
        setMessage({ 
          text: 'Product updated successfully!', 
          type: 'success' 
        });
      } else {
        // Add new product
        const res = await axios.post(
          'https://bidding-system-6vjf.onrender.com/api/products',
          productData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Add the new product to the beginning of the list
        setProducts(prev => [res.data, ...prev]);
        
        setMessage({ 
          text: 'Product added successfully!', 
          type: 'success' 
        });
      }
      
      // Reset form and close the add product form
      setProductForm({
        title: "",
        description: "",
        imageUrl: "",
        startPrice: "",
        auctionEndTime: "",
        category: "ring",
        _id: null
      });
      setIsAddingProduct(false);
      
    } catch (err) {
      console.error('Error saving product:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to save product', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }
  };

  // Handle updating a product
  const handleUpdateProduct = async (productId, updates) => {
    try {
      setLoading(true);
      const res = await axios.put(
        `https://bidding-system-6vjf.onrender.com/api/products/${productId}`,
        updates,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(prev => 
        prev.map(p => p._id === productId ? res.data : p)
      );
      
      setMessage({ 
        text: 'Product updated successfully!', 
        type: 'success' 
      });
      return true;
    } catch (err) {
      console.error('Error updating product:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to update product', 
        type: 'error' 
      });
      return false;
    } finally {
      setLoading(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(
        `https://bidding-system-6vjf.onrender.com/api/products/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setProducts(prev => prev.filter(p => p._id !== productId));
      
      setMessage({ 
        text: 'Product deleted successfully', 
        type: 'success' 
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      setMessage({ 
        text: err.response?.data?.message || 'Failed to delete product', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    }
  };

  // Format price with currency
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format date
  const formatDisplayDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata'
    });
  };

  // Loading and error states
  if (loading && !seller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <FiX className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return <div className="text-center py-10">No seller data available.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center">
            <div className="relative group">
              <img
                src={seller.image || "/default-avatar.png"}
                alt={seller.name}
                className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-yellow-100 shadow-lg object-cover"
              />
              {editMode && (
                <label className="absolute bottom-0 right-0 bg-yellow-600 text-white p-2 rounded-full cursor-pointer hover:bg-yellow-700 transition-colors">
                  <FiUpload className="h-5 w-5" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                  />
                </label>
              )}
            </div>
            
            <div className="mt-6 md:mt-0 md:ml-8 flex-1">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      name="bio"
                      rows="3"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    ></textarea>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{seller.name}</h1>
                  <p className="mt-2 text-gray-600">{seller.bio || "Luxury jewelry artisan"}</p>
                  <p className="mt-1 text-sm text-gray-500">{seller.email}</p>
                </div>
              )}
              
              <div className="mt-6 flex space-x-4">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={handleProfileSubmit}
                      disabled={loading}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Profile'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditMode(false)}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditMode(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    <FiEdit2 className="mr-2 h-4 w-4" />
                    Edit Profile
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-8">
        <div className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Products</h2>
              <p className="text-sm text-gray-500 mt-1">
                Manage your jewelry listings
              </p>
            </div>
            <button
              type="button"
              onClick={toggleAddProduct}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <FiPlus className="mr-2 h-4 w-4" />
              Add New Product
            </button>
          </div>

          {/* Add Product Form */}
          {isAddingProduct && (
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {productForm._id ? 'Edit Product' : 'Add New Product'}
              </h3>
              <form onSubmit={handleProductSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={productForm.title}
                    onChange={handleProductInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="e.g., Diamond Solitaire Ring"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={productForm.description}
                    onChange={handleProductInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    placeholder="Add a detailed description of your product"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Starting Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">₹</span>
                      </div>
                      <input
                        type="number"
                        name="startPrice"
                        value={productForm.startPrice}
                        onChange={handleProductInputChange}
                        className="focus:ring-yellow-500 focus:border-yellow-500 block w-full pl-7 pr-12 sm:text-sm border-gray-300 rounded-md"
                        placeholder="0.00"
                        min="0"
                        step="100"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleProductInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    >
                      <option value="ring">Ring</option>
                      <option value="necklace">Necklace</option>
                      <option value="earring">Earring</option>
                      <option value="bracelet">Bracelet</option>
                      <option value="watch">Watch</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Auction End Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="auctionEndTime"
                    value={productForm.auctionEndTime}
                    onChange={handleProductInputChange}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Image <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1 flex items-center">
                    <span className="h-24 w-24 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                      {productForm.imageUrl ? (
                        <img
                          src={productForm.imageUrl}
                          alt="Product preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <FiImage className="h-12 w-12 text-gray-300" />
                      )}
                    </span>
                    <label className="ml-5 flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 cursor-pointer">
                      <FiUpload className="mr-2 h-4 w-4" />
                      Upload
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, true)}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={toggleAddProduct}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : (productForm._id ? 'Update Product' : 'Add Product')}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products List */}
          {products.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <FiPackage className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by adding a new product.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={toggleAddProduct}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <FiPlus className="-ml-1 mr-2 h-5 w-5" />
                  New Product
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard 
                  key={product._id} 
                  product={product}
                  onDelete={handleDeleteProduct}
                  onEdit={(product) => {
                    // Set the form to edit mode with the product data
                    setProductForm({
                      title: product.title,
                      description: product.description,
                      imageUrl: product.imageUrl,
                      startPrice: product.startPrice,
                      auctionEndTime: format(new Date(product.auctionEndTime), "yyyy-MM-dd'T'HH:mm"),
                      category: product.category || 'ring',
                      _id: product._id // Store the product ID for updates
                    });
                    setIsAddingProduct(true);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`fixed bottom-4 right-4 p-4 rounded-md ${
          message.type === 'error' ? 'bg-red-50 border-l-4 border-red-500' : 'bg-green-50 border-l-4 border-green-500'
        }`}>
          <div className="flex">
            <div className="flex-shrink-0">
              {message.type === 'error' ? (
                <FiX className="h-5 w-5 text-red-500" />
              ) : (
                <FiCheck className="h-5 w-5 text-green-500" />
              )}
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${
                message.type === 'error' ? 'text-red-800' : 'text-green-800'
              }`}>
                {message.text}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProfile;