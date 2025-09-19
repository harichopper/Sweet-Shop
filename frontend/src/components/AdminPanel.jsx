import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminPanel = () => {
  const [sweets, setSweets] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [searchFilters, setSearchFilters] = useState({
    name: '',
    category: '',
    minPrice: '',
    maxPrice: ''
  });

  useEffect(() => {
    fetchSweets();
  }, []);

  const fetchSweets = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/sweets');
      setSweets(response.data);
    } catch (error) {
      console.error('Error fetching sweets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      await axios.post('/api/sweets', {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      });
      setFormData({ name: '', category: '', price: '', quantity: '' });
      fetchSweets();
      setMessage('Sweet added successfully!');
    } catch (error) {
      setMessage('Error creating sweet: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (sweetId) => {
    setLoading(true);
    setMessage('');
    try {
      await axios.delete(`/api/sweets/${sweetId}`);
      fetchSweets();
      setMessage('Sweet deleted successfully!');
    } catch (error) {
      setMessage('Error deleting sweet: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const params = new URLSearchParams();
      if (searchFilters.name) params.append('name', searchFilters.name);
      if (searchFilters.category) params.append('category', searchFilters.category);
      if (searchFilters.minPrice) params.append('minPrice', searchFilters.minPrice);
      if (searchFilters.maxPrice) params.append('maxPrice', searchFilters.maxPrice);
      
      const response = await axios.get(`/api/sweets/search?${params.toString()}`);
      setSweets(response.data);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const clearSearch = () => {
    setSearchFilters({ name: '', category: '', minPrice: '', maxPrice: '' });
    fetchSweets(); // Reload all sweets
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
      {message && (
        <p className={`mb-4 text-center ${message.includes('successful') ? 'text-green-500' : 'text-red-500'}`}>
          {message}
        </p>
      )}
      {/* Add Sweet Form */}
      <div className="card p-6 mb-8">
        <h3 className="text-xl font-semibold mb-4">Add New Sweet</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Sweet Name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="input-field"
            required
          />
          <input
            type="text"
            placeholder="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="input-field"
            required
          />
          <input
            type="number"
            step="0.01"
            placeholder="Price"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: e.target.value})}
            className="input-field"
            required
          />
          <input
            type="number"
            placeholder="Quantity"
            value={formData.quantity}
            onChange={(e) => setFormData({...formData, quantity: e.target.value})}
            className="input-field"
            required
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Processing...' : 'Add Sweet'}
          </button>
        </form>
      </div>

      {/* Search Sweets */}
      <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">🔍 Search Sweets</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchFilters.name}
            onChange={(e) => setSearchFilters({...searchFilters, name: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />
          <select
            value={searchFilters.category}
            onChange={(e) => setSearchFilters({...searchFilters, category: e.target.value})}
            className="border rounded-lg px-3 py-2"
          >
            <option value="">All Categories</option>
            <option value="Chocolate">Chocolate</option>
            <option value="Gummy">Gummy</option>
            <option value="Hard Candy">Hard Candy</option>
            <option value="Caramel">Caramel</option>
            <option value="Premium">Premium</option>
          </select>
          <input
            type="number"
            placeholder="Min Price"
            value={searchFilters.minPrice}
            onChange={(e) => setSearchFilters({...searchFilters, minPrice: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />
          <input
            type="number"
            placeholder="Max Price"
            value={searchFilters.maxPrice}
            onChange={(e) => setSearchFilters({...searchFilters, maxPrice: e.target.value})}
            className="border rounded-lg px-3 py-2"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            className="btn-primary flex items-center space-x-2"
          >
            <span>🔍</span>
            <span>Search</span>
          </button>
          <button
            onClick={clearSearch}
            className="btn-secondary flex items-center space-x-2"
          >
            <span>🔄</span>
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Sweets List */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold mb-4">Manage Sweets</h3>
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3">Name</th>
                  <th className="text-left p-3">Category</th>
                  <th className="text-left p-3">Price</th>
                  <th className="text-left p-3">Quantity</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sweets.map(sweet => (
                  <tr key={sweet._id} className="border-b">
                    <td className="p-3">{sweet.name}</td>
                    <td className="p-3">{sweet.category}</td>
                    <td className="p-3">${sweet.price}</td>
                    <td className="p-3">{sweet.quantity}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(sweet.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;