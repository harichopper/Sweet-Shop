import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from './Navigation';
import axios from 'axios';
import Swal from 'sweetalert2';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [sweets, setSweets] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    quantity: ''
  });

  useEffect(() => {
    fetchSweets();
  }, []);

  const fetchSweets = async () => {
    try {
      const response = await axios.get('/api/sweets');
      setSweets(response.data);
      calculateStats(response.data);
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: '📊 Error Loading Data',
        text: 'Failed to fetch dashboard data',
        confirmButtonColor: '#f97316'
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (sweetsData) => {
    const totalSweets = sweetsData.length;
    const totalValue = sweetsData.reduce((sum, sweet) => sum + (sweet.price * sweet.quantity), 0);
    const lowStock = sweetsData.filter(sweet => sweet.quantity < 10).length;
    const outOfStock = sweetsData.filter(sweet => sweet.quantity === 0).length;
    const categories = [...new Set(sweetsData.map(sweet => sweet.category))].length;

    setStats({
      totalSweets,
      totalValue,
      lowStock,
      outOfStock,
      categories
    });
  };

  const handleAddSweet = async (e) => {
    e.preventDefault();
    
    if (!isAdmin) {
      Swal.fire({
        icon: 'error',
        title: '🚫 Access Denied',
        text: 'Only administrators can add sweets to our collection',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    try {
      Swal.fire({
        title: '🍭 Adding Sweet...',
        text: 'Creating your delicious treat',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      await axios.post('/api/sweets', {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity)
      });

      setFormData({ name: '', category: '', price: '', quantity: '' });
      fetchSweets();

      Swal.fire({
        icon: 'success',
        title: '🎉 Sweet Added!',
        text: 'New delicious treat has been added to our collection!',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: '😞 Failed to Add Sweet',
        text: error.response?.data?.error || 'Something went wrong while adding the sweet',
        confirmButtonColor: '#f97316'
      });
    }
  };

  const handleDeleteSweet = async (sweetId, sweetName) => {
    if (!isAdmin) {
      Swal.fire({
        icon: 'error',
        title: '🚫 Access Denied',
        text: 'Only administrators can remove sweets',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    const result = await Swal.fire({
      title: '🗑️ Are you sure?',
      text: `Remove "${sweetName}" from our sweet collection? This action cannot be undone!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Yes, remove it!',
      cancelButtonText: 'Keep it'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`/api/sweets/${sweetId}`);
        fetchSweets();
        
        Swal.fire({
          icon: 'success',
          title: '🗑️ Deleted!',
          text: `${sweetName} has been removed from our collection`,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: '😞 Delete Failed',
          text: error.response?.data?.error || 'Failed to remove sweet',
          confirmButtonColor: '#f97316'
        });
      }
    }
  };

  const handleRestockSweet = async (sweetId, sweetName) => {
    if (!isAdmin) {
      Swal.fire({
        icon: 'error',
        title: '🚫 Access Denied',
        text: 'Only administrators can restock sweets',
        confirmButtonColor: '#f97316'
      });
      return;
    }

    const { value: quantity } = await Swal.fire({
      title: `📦 Restock ${sweetName}`,
      input: 'number',
      inputLabel: 'Enter quantity to add to our sweet collection',
      inputPlaceholder: 'e.g., 50 delicious pieces',
      inputAttributes: {
        min: 1,
        step: 1
      },
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      inputValidator: (value) => {
        if (!value || value <= 0) {
          return 'Please enter a valid quantity! 🍭'
        }
      }
    });

    if (quantity) {
      try {
        await axios.post(`/api/sweets/${sweetId}/restock`, { 
          quantity: parseInt(quantity) 
        });
        fetchSweets();
        
        Swal.fire({
          icon: 'success',
          title: '📦 Restocked!',
          text: `Added ${quantity} units to ${sweetName}`,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: '😞 Restock Failed',
          text: error.response?.data?.error || 'Failed to restock sweet',
          confirmButtonColor: '#f97316'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading dashboard... 📊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
            📊 Sweet Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Welcome back, {user.username}! {isAdmin && '👑 (Administrator)'} 
            Manage your sweet collection here.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">🍬</div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.totalSweets}</div>
            <div className="text-gray-600">Total Sweets</div>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${stats.totalValue?.toFixed(2)}
            </div>
            <div className="text-gray-600">Total Value</div>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">📁</div>
            <div className="text-3xl font-bold text-purple-600 mb-2">{stats.categories}</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">⚠️</div>
            <div className="text-3xl font-bold text-yellow-600 mb-2">{stats.lowStock}</div>
            <div className="text-gray-600">Low Stock</div>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">😞</div>
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.outOfStock}</div>
            <div className="text-gray-600">Out of Stock</div>
          </div>
        </div>

        {/* Add Sweet Form (Admin Only) */}
        {isAdmin && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4 flex items-center">
              ✨ Add New Sweet Treat
            </h2>
            <form onSubmit={handleAddSweet} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="🍭 Sweet Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="text"
                placeholder="📁 Category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="input-field"
                required
              />
              <input
                type="number"
                step="0.01"
                placeholder="💵 Price ($)"
                value={formData.price}
                onChange={(e) => setFormData({...formData, price: e.target.value})}
                className="input-field"
                required
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="📦 Quantity"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  className="input-field flex-1"
                  required
                />
                <button type="submit" className="btn-primary px-6 flex items-center space-x-2">
                  <span>✨</span>
                  <span>Add Sweet</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Sweets Management Table */}
        <div className="card p-6">
          <h2 className="text-2xl font-semibold mb-4 flex items-center">
            🍯 Sweet Inventory Management
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left p-3 font-semibold">🍭 Name</th>
                  <th className="text-left p-3 font-semibold">📁 Category</th>
                  <th className="text-left p-3 font-semibold">💵 Price</th>
                  <th className="text-left p-3 font-semibold">📦 Quantity</th>
                  <th className="text-left p-3 font-semibold">📊 Status</th>
                  {isAdmin && <th className="text-left p-3 font-semibold">⚙️ Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sweets.map(sweet => (
                  <tr key={sweet._id} className="border-b hover:bg-gray-50 transition-colors">
                    <td className="p-3 font-medium">{sweet.name}</td>
                    <td className="p-3">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                        {sweet.category}
                      </span>
                    </td>
                    <td className="p-3 font-medium text-green-600">${sweet.price}</td>
                    <td className="p-3">
                      <span className={`font-medium flex items-center ${
                        sweet.quantity === 0 
                          ? 'text-red-600' 
                          : sweet.quantity < 10 
                          ? 'text-yellow-600' 
                          : 'text-green-600'
                      }`}>
                        {sweet.quantity === 0 ? '😞' : sweet.quantity < 10 ? '⚠️' : '✅'} {sweet.quantity}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        sweet.quantity === 0 
                          ? 'bg-red-100 text-red-800' 
                          : sweet.quantity < 10 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sweet.quantity === 0 ? '😞 Out of Stock' : sweet.quantity < 10 ? '⚠️ Low Stock' : '✅ In Stock'}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRestockSweet(sweet._id, sweet.name)}
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600 transition-colors flex items-center space-x-1"
                          >
                            <span>📦</span>
                            <span>Restock</span>
                          </button>
                          <button
                            onClick={() => handleDeleteSweet(sweet._id, sweet.name)}
                            className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 transition-colors flex items-center space-x-1"
                          >
                            <span>🗑️</span>
                            <span>Delete</span>
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            
            {sweets.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">🍭</div>
                <p className="text-lg">No sweets found in inventory</p>
                <p className="text-sm">Start by adding some delicious treats!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
