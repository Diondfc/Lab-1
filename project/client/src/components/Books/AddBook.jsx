import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../../lib/api.js';
import { 
  FiPlusCircle, 
  FiX, 
  FiCheck, 
  FiAlertCircle,
  FiLoader,
  FiArrowLeft
} from 'react-icons/fi';

const AddBook = () => {
  const [formData, setFormData] = useState({
    ISBN: '',
    Title: '',
    AvailabilityStatus: 'Available',
    Publisher: '',
    YearOfPublishment: '',
    CategoryID: '',
    SubCategoryID: '',
    Author: '',
    Rating: '',
    Description: '',
    Quantity: '',
  });

  const [coverImage, setCoverImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    if (name === 'Rating') {
      // Special handling for empty input
      if (value === '') {
        setFormData(prev => ({ ...prev, Rating: '' }));
        return;
      }
  
      // Parse the input while preserving decimal format
      const numValue = parseFloat(value);
      if (isNaN(numValue)) return; // Don't update if invalid
  
      // Clamp the value between 0 and 5
      const clampedValue = Math.min(Math.max(numValue, 0), 5);
  
      // Update state with the clamped value
      setFormData(prev => ({ ...prev, Rating: value.includes('.') ? clampedValue : value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setCoverImage(e.target.files[0]);
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Required fields for all books
    const requiredFields = [
      'ISBN', 'Title', 'CategoryID', 'Author', 
      'Quantity', 'Description', 'Publisher', 'YearOfPublishment', 'Rating'
    ];

    requiredFields.forEach(field => {
      if (!formData[field]) {
        newErrors[field] = 'This field is required';
        isValid = false;
      }
    });

    // Special validation for SubCategoryID
    if (formData.CategoryID === '3' && !formData.SubCategoryID) {
      newErrors.SubCategoryID = 'Genre is required for novels';
      isValid = false;
    }

    // Validate Quantity is a positive number
    if (formData.Quantity && (isNaN(formData.Quantity) || formData.Quantity <= 0)) {
      newErrors.Quantity = 'Quantity must be a positive number';
      isValid = false;
    }

    // Validate Year is reasonable
    if (formData.YearOfPublishment) {
      const currentYear = new Date().getFullYear();
      const year = parseInt(formData.YearOfPublishment);
      if (isNaN(year) || year < 1000 || year > currentYear) {
        newErrors.YearOfPublishment = 'Please enter a valid year';
        isValid = false;
      }
    }

    // Validate Rating
    if (formData.Rating === '' || isNaN(formData.Rating)) {
      newErrors.Rating = 'Rating is required';
      isValid = false;
    } else if (formData.Rating < 0 || formData.Rating > 5) {
      newErrors.Rating = 'Rating must be between 0.0 and 5.0';
      isValid = false;
    } else if (formData.Rating === 0.0 && formData.Rating.toString() === '0') {
      newErrors.Rating = 'Please enter 0 instead of 0.0';
      isValid = false;
    }
    
    if (!coverImage) {
      newErrors.coverImage = 'Cover image is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const data = new FormData();
      for (const key in formData) {
        data.append(key, formData[key]);
      }
      if (coverImage) {
        data.append('coverImage', coverImage);
      }

      await axios.post(apiUrl('/api/books/add'), data, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const categoryId = formData.CategoryID;

      setLoading(false);
      setSuccessMessage('Book added successfully!');

      setFormData({
        ISBN: '',
        Title: '',
        AvailabilityStatus: 'Available',
        Publisher: '',
        YearOfPublishment: '',
        CategoryID: '',
        SubCategoryID: '',
        Author: '',
        Rating: '',
        Description: '',
        Quantity: '',
      });
      setCoverImage(null);
      window.scrollTo(0, 0);

      setTimeout(() => {
        if (categoryId === '1') {
          navigate('/academic');
        } else if (categoryId === '2') {
          navigate('/journals');
        } else if (categoryId === '3') {
          navigate('/novels');
        }
      }, 1500);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
      setErrorMessage('Error adding book. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-[#036280] hover:text-[#012F4A] mb-6"
        >
          <FiArrowLeft className="mr-2" /> Back to Admin Panel
        </button>

        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
          <div className="bg-gradient-to-r from-[#036280] to-[#233B7D] p-6 text-white">
            <div className="flex items-center">
              <FiPlusCircle className="text-2xl mr-3" />
              <h2 className="text-2xl font-semibold">Add New Book</h2>
            </div>
            <p className="mt-1 opacity-90">Fill in the details below to add a new book to the collection</p>
          </div>

          <div className="p-6">
            {successMessage && (
              <div className="relative animate-slide-in text-green-700 bg-green-50 p-4 rounded-lg font-medium mb-6 border border-green-200 flex items-start">
                <FiCheck className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  {successMessage}
                  <p className="text-sm font-normal mt-1 text-green-600">Redirecting you shortly...</p>
                </div>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="absolute top-3 right-3 text-green-800 hover:text-green-600"
                >
                  <FiX />
                </button>
              </div>
            )}

            {errorMessage && (
              <div className="relative text-red-700 bg-red-50 p-4 rounded-lg font-medium mb-6 border border-red-200 flex items-start">
                <FiAlertCircle className="text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>{errorMessage}</div>
                <button
                  onClick={() => setErrorMessage('')}
                  className="absolute top-3 right-3 text-red-800 hover:text-red-600"
                >
                  <FiX />
                </button>
              </div>
            )}

            {loading && (
              <div className="text-yellow-700 bg-yellow-50 p-4 rounded-lg font-medium mb-6 border border-yellow-200 flex items-center">
                <FiLoader className="animate-spin mr-2" />
                <span>Adding the book, please wait...</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6" encType="multipart/form-data">
              {/* Left Column - Basic Information */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">ISBN *</label>
                  <input
                    type="text"
                    name="ISBN"
                    placeholder="Enter ISBN"
                    value={formData.ISBN}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.ISBN ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent`}
                  />
                  {errors.ISBN && <p className="text-red-500 text-xs mt-1">{errors.ISBN}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Title *</label>
                  <input
                    type="text"
                    name="Title"
                    placeholder="Enter Title"
                    value={formData.Title}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.Title ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent`}
                  />
                  {errors.Title && <p className="text-red-500 text-xs mt-1">{errors.Title}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Publisher *</label>
                  <input
                    type="text"
                    name="Publisher"
                    placeholder="Enter Publisher"
                    value={formData.Publisher}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.Publisher ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent`}
                  />
                  {errors.Publisher && <p className="text-red-500 text-xs mt-1">{errors.Publisher}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Year of Publication *</label>
                  <input
                    type="number"
                    name="YearOfPublishment"
                    placeholder="Enter Year"
                    value={formData.YearOfPublishment}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.YearOfPublishment ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent`}
                  />
                  {errors.YearOfPublishment && <p className="text-red-500 text-xs mt-1">{errors.YearOfPublishment}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Author *</label>
                  <input
                    type="text"
                    name="Author"
                    placeholder="Enter Author"
                    value={formData.Author}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.Author ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent`}
                  />
                  {errors.Author && <p className="text-red-500 text-xs mt-1">{errors.Author}</p>}
                </div>
              </div>

              {/* Right Column - Additional Information */}
              <div className="space-y-5">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Category *</label>
                  <div className="relative">
                    <select
                      name="CategoryID"
                      value={formData.CategoryID}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${errors.CategoryID ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent appearance-none bg-white pr-10`}
                    >
                      <option value="">Select Category</option>
                      <option value="1">Academic</option>
                      <option value="2">Journal</option>
                      <option value="3">Novel</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.CategoryID && <p className="text-red-500 text-xs mt-1">{errors.CategoryID}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Genre (if Novel)</label>
                  <div className="relative">
                    <select
                      name="SubCategoryID"
                      value={formData.SubCategoryID}
                      onChange={handleChange}
                      className={`w-full px-4 py-2.5 border ${errors.SubCategoryID ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent appearance-none bg-white pr-10 ${formData.CategoryID !== '3' ? 'bg-gray-50 text-gray-400' : ''}`}
                      disabled={formData.CategoryID !== '3'}
                    >
                      <option value="">Select Genre</option>
                      <option value="1">History</option>
                      <option value="2">Romance</option>
                      <option value="3">Mystery</option>
                      <option value="4">Fiction</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.SubCategoryID && <p className="text-red-500 text-xs mt-1">{errors.SubCategoryID}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Availability Status</label>
                  <div className="relative">
                    <select
                      name="AvailabilityStatus"
                      value={formData.AvailabilityStatus}
                      onChange={handleChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent appearance-none bg-white pr-10"
                    >
                      <option value="Available">Available</option>
                      <option value="Checked Out">Checked Out</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Rating *</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    name="Rating"
                    placeholder="Enter Rating (0.0-5.0)"
                    value={formData.Rating}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.Rating ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent`}
                  />
                  {errors.Rating && <p className="text-red-500 text-xs mt-1">{errors.Rating}</p>}
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-gray-700">Quantity *</label>
                  <input
                    type="number"
                    name="Quantity"
                    placeholder="Enter Quantity"
                    value={formData.Quantity}
                    onChange={handleChange}
                    className={`w-full px-4 py-2 border ${errors.Quantity ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent`}
                  />
                  {errors.Quantity && <p className="text-red-500 text-xs mt-1">{errors.Quantity}</p>}
                </div>
              </div>

              {/* Full-width fields at bottom */}
              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Description *</label>
                <textarea
                  name="Description"
                  placeholder="Enter book description..."
                  value={formData.Description}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 border ${errors.Description ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-[#036280] focus:border-transparent h-32`}
                ></textarea>
                {errors.Description && <p className="text-red-500 text-xs mt-1">{errors.Description}</p>}
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Cover Image *</label>
                <div className={`border-2 border-dashed ${errors.coverImage ? 'border-red-300' : 'border-gray-300'} rounded-lg p-4 text-center`}>
                  <input
                    type="file"
                    name="coverImage"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="coverImageInput"
                  />
                  <label htmlFor="coverImageInput" className="cursor-pointer">
                    {coverImage ? (
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Selected: {coverImage.name}</p>
                        <button 
                          type="button" 
                          onClick={(e) => {
                            e.stopPropagation();
                            setCoverImage(null);
                          }}
                          className="mt-2 text-sm text-blue-500 hover:text-blue-700"
                        >
                          Change Image
                        </button>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-gray-500">Click to upload cover image</p>
                        <p className="text-xs text-gray-400 mt-1">(JPEG, PNG, max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
                {errors.coverImage && <p className="text-red-500 text-xs mt-1">{errors.coverImage}</p>}
              </div>

              {/* Submit button */}
              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#036280] to-[#233B7D] hover:from-[#012F4A] hover:to-[#122B5C] text-white font-medium py-3 px-4 rounded-lg shadow-md transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FiPlusCircle className="mr-2" />
                      Add Book
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddBook;