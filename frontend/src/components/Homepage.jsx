import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Navigation from './Navigation';
import axios from 'axios';
import Swal from 'sweetalert2';

const Homepage = () => {
  const { user, isAdmin } = useAuth();
  const [sweets, setSweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchSweets();
  }, []);

  const fetchSweets = async () => {
    try {
      const response = await axios.get('/api/sweets');
      setSweets(response.data);
    } catch (error) {
      console.error('Error fetching sweets:', error.response?.data || error.message);
      Swal.fire({
        icon: 'error',
        title: '🍯 Oops!',
        text: 'Failed to load our sweet collection. Please try again later.',
        confirmButtonColor: '#f97316'
      });
    } finally {
      setLoading(false);
    }
  };

  const purchaseSweet = async (sweetId, sweetName) => {
    const result = await Swal.fire({
      title: '🛒 Confirm Purchase',
      text: `Add "${sweetName}" to your cart?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#f97316',
      cancelButtonColor: '#6b7280',
      confirmButtonText: '🍬 Yes, buy it!',
      cancelButtonText: 'Maybe later'
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: '🎁 Processing...',
          text: 'Adding sweet treats to your order',
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          }
        });

        await axios.post(`/api/sweets/${sweetId}/purchase`);
        fetchSweets();

        Swal.fire({
          icon: 'success',
          title: '🎉 Purchase Successful!',
          text: `"${sweetName}" has been added to your collection!`,
          timer: 2000,
          showConfirmButton: false
        });
      } catch (error) {
        Swal.fire({
          icon: 'error',
          title: '😞 Purchase Failed',
          text: error.response?.data?.error || 'Something went wrong with your sweet purchase',
          confirmButtonColor: '#f97316'
        });
      }
    }
  };

  const categories = [...new Set(sweets.map(sweet => sweet.category))];
  
  const filteredSweets = sweets.filter(sweet => {
    const matchesSearch = sweet.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || sweet.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const stats = {
    totalSweets: sweets.length,
    totalValue: sweets.reduce((sum, sweet) => sum + (sweet.price * sweet.quantity), 0),
    lowStock: sweets.filter(sweet => sweet.quantity < 10).length,
    categories: categories.length
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading sweet treats... 🍭</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-orange-50 to-yellow-50">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            🌟 Sweet Dreams Come True! 🌟
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Welcome to our magical sweet shop where every treat tells a story. 
            Discover our handcrafted collection of premium sweets, chocolates, and confections 
            made with love and the finest ingredients from around the world.
          </p>
          <div className="flex justify-center mt-6 space-x-2">
            <span className="text-2xl">🍫</span>
            <span className="text-2xl">🍬</span>
            <span className="text-2xl">🧁</span>
            <span className="text-2xl">🍭</span>
            <span className="text-2xl">🍩</span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">🍬</div>
            <div className="text-3xl font-bold text-primary-600 mb-2">{stats.totalSweets}</div>
            <div className="text-gray-600">Sweet Varieties</div>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">💰</div>
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${stats.totalValue.toFixed(2)}
            </div>
            <div className="text-gray-600">Total Value</div>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">📁</div>
            <div className="text-3xl font-bold text-blue-600 mb-2">{stats.categories}</div>
            <div className="text-gray-600">Categories</div>
          </div>
          <div className="card p-6 text-center hover:shadow-xl transition-shadow">
            <div className="text-4xl mb-2">⚠️</div>
            <div className="text-3xl font-bold text-red-600 mb-2">{stats.lowStock}</div>
            <div className="text-gray-600">Low Stock</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <span className="absolute left-3 top-3 text-xl">🔍</span>
                <input
                  type="text"
                  placeholder="Search for your favorite sweets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-field pl-12"
                />
              </div>
            </div>
            <div className="md:w-48">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field"
              >
                <option value="">🍭 All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    🍬 {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Sweets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSweets.map(sweet => (
            <div key={sweet._id} className="card overflow-hidden hover:shadow-2xl transition-shadow duration-300">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                    🍭 {sweet.name}
                  </h3>
                  <span className="bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-800 px-3 py-1 rounded-full text-xs font-medium">
                    {sweet.category}
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center">
                      💵 Price:
                    </span>
                    <span className="text-2xl font-bold text-green-600">${sweet.price}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 flex items-center">
                      📦 Stock:
                    </span>
                    <span className={`font-medium flex items-center ${
                      sweet.quantity < 10 
                        ? 'text-red-600' 
                        : sweet.quantity < 20 
                        ? 'text-yellow-600' 
                        : 'text-green-600'
                    }`}>
                      {sweet.quantity === 0 ? '😞' : sweet.quantity < 10 ? '⚠️' : '✅'} {sweet.quantity} units
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-300 ${
                        sweet.quantity < 10 
                          ? 'bg-gradient-to-r from-red-400 to-red-600' 
                          : sweet.quantity < 20 
                          ? 'bg-gradient-to-r from-yellow-400 to-orange-500' 
                          : 'bg-gradient-to-r from-green-400 to-green-600'
                      }`}
                      style={{ width: `${Math.min((sweet.quantity / 50) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => purchaseSweet(sweet._id, sweet.name)}
                  disabled={sweet.quantity === 0}
                  className="w-full mt-6 btn-primary disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {sweet.quantity === 0 ? (
                    <>
                      <span>😞</span>
                      <span>Out of Stock</span>
                    </>
                  ) : (
                    <>
                      <span>🛒</span>
                      <span>Purchase Sweet</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredSweets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-8xl mb-6">🔍</div>
            <h3 className="text-2xl font-medium text-gray-900 mb-4">No sweets found</h3>
            <p className="text-gray-600 text-lg">
              Try adjusting your search terms or browse all our delicious categories.
            </p>
          </div>
        )}

        {/* Featured Section */}
        <div className="mt-16 card p-8">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            🌈 Why Choose Sweet Delights? 🌈
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-6xl mb-4">🏆</div>
              <h4 className="text-xl font-semibold mb-3">Premium Quality</h4>
              <p className="text-gray-600 leading-relaxed">
                Handcrafted with the finest ingredients sourced from around the world. 
                Every sweet is a masterpiece of flavor and quality.
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">🚀</div>
              <h4 className="text-xl font-semibold mb-3">Fast Delivery</h4>
              <p className="text-gray-600 leading-relaxed">
                Quick and secure delivery to satisfy your sweet cravings instantly. 
                Fresh treats delivered right to your doorstep.
              </p>
            </div>
            <div className="text-center">
              <div className="text-6xl mb-4">💝</div>
              <h4 className="text-xl font-semibold mb-3">Gift Ready</h4>
              <p className="text-gray-600 leading-relaxed">
                Beautiful packaging perfect for gifts and special occasions. 
                Spread sweetness and joy to your loved ones.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Homepage;
