import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiEdit2, FiTrash2, FiX, FiCheck, FiBookOpen } from 'react-icons/fi';
import { apiClient } from '../../lib/api';
import AddBookForm from './AddBookForm';

// Përdorim një komponent të thjeshtë për ReadingGoal nëse nuk ekziston tashmë i ndarë
const ReadingGoal = ({ booksRead, goal = 10 }) => {
  const progress = Math.min((booksRead / goal) * 100, 100);
  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-blue-100/50 mb-6 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-bold text-[#012F4a] flex items-center gap-2">
          <FiBookOpen className="text-[#2E7AD2]" />
          Reading Goal
        </h3>
        <span className="text-sm font-bold text-[#2E7AD2] bg-blue-50 px-3 py-1 rounded-full">
          {booksRead} / {goal}
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
        <div 
          className="bg-gradient-to-r from-[#2E7AD2] to-[#3498db] h-3 rounded-full transition-all duration-1000 ease-out" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className="text-xs text-gray-500 mt-2 font-medium">
        {booksRead >= goal ? 'Goal reached! 🎉' : `Keep reading! ${goal - booksRead} more to go.`}
      </p>
    </div>
  );
};

const Bookshelf = () => {
  const [books, setBooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State për formën e shtimit
  const [addTitle, setAddTitle] = useState('');
  const [addSpineColor, setAddSpineColor] = useState('#2e7ad2');
  const [isAdding, setIsAdding] = useState(false);

  // State për modalin e editimit
  const [editingBook, setEditingBook] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSpineColor, setEditSpineColor] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    // Check për authentication
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchBooks();
  }, [navigate]);

  const fetchBooks = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await apiClient.get('/api/bookshelf', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Sigurohemi që marrim një array
      setBooks(Array.isArray(response.data) ? response.data : []);
      setError('');
    } catch (err) {
      console.error('Error fetching bookshelf:', err);
      setError('Failed to load bookshelf. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    if (!addTitle.trim()) return;

    try {
      setIsAdding(true);
      const token = localStorage.getItem('token');
      const response = await apiClient.post('/api/bookshelf', {
        title: addTitle,
        spineColor: addSpineColor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBooks([...books, response.data]);
      setAddTitle('');
      setError('');
    } catch (err) {
      console.error('Error adding book:', err);
      setError('Failed to add book.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Are you sure you want to remove this book from your shelf?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await apiClient.delete(`/api/bookshelf/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(books.filter(book => book._id !== id && book.id !== id));
    } catch (err) {
      console.error('Error deleting book:', err);
      alert('Failed to delete book.');
    }
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    setEditTitle(book.title);
    setEditSpineColor(book.spineColor || '#2e7ad2');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const bookId = editingBook._id || editingBook.id;
      const response = await apiClient.put(`/api/bookshelf/${bookId}`, {
        title: editTitle,
        spineColor: editSpineColor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBooks(books.map(book => 
        (book._id === bookId || book.id === bookId) ? response.data : book
      ));
      setIsEditModalOpen(false);
      setEditingBook(null);
    } catch (err) {
      console.error('Error updating book:', err);
      alert('Failed to update book.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 pl-2 border-l-4 border-[#2E7AD2]">
          <h1 className="text-3xl font-bold text-[#012F4a]">My Bookshelf</h1>
          <p className="text-gray-500 mt-1">Manage your digital library collection</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Kolona e majtë - Forma dhe Goal */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <ReadingGoal booksRead={books.length} goal={15} />
            
            <AddBookForm 
              addTitle={addTitle}
              setAddTitle={setAddTitle}
              addSpineColor={addSpineColor}
              setAddSpineColor={setAddSpineColor}
              handleAddBook={handleAddBook}
              isLoading={isAdding}
              error={error}
            />
          </div>

          {/* Kolona e djathtë - Rafti i librave */}
          <div className="lg:col-span-8">
            <div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 min-h-[500px]">
              <div className="flex justify-between items-end mb-10 border-b pb-4">
                <h2 className="text-xl font-bold text-[#012F4a]">Your Collection</h2>
                <span className="text-sm font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  {books.length} {books.length === 1 ? 'Book' : 'Books'}
                </span>
              </div>

              {isLoading ? (
                <div className="flex flex-col justify-center items-center h-64 gap-4">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#2E7AD2]"></div>
                  <p className="text-gray-500 font-medium animate-pulse">Loading your shelf...</p>
                </div>
              ) : books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                    <FiBookOpen className="text-4xl text-gray-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-1">Your shelf is empty</h3>
                  <p className="text-gray-500 max-w-xs">Start adding some books from the left panel to build your digital library.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Prapavija e raftit (wood texture ose simple color) */}
                  <div className="flex flex-wrap items-end gap-[2px] pb-5 border-b-[16px] border-[#8B5A2B] rounded-sm relative px-4 pt-16 bg-[#F5DEB3]/20">
                    {/* Shadow effect on the shelf */}
                    <div className="absolute bottom-0 left-0 right-0 h-4 bg-white/10 -mb-4 blur-sm rounded-full"></div>
                    
                    {books.map((book) => {
                      const bookId = book._id || book.id;
                      const spineColor = book.spineColor || '#2e7ad2';
                      
                      return (
                        <div 
                          key={bookId} 
                          className="group relative flex flex-col items-center justify-end w-12 sm:w-16 h-48 sm:h-56 transition-all duration-300 hover:-translate-y-4 hover:z-20 cursor-pointer"
                        >
                          {/* Hover Actions Tooltips */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-95 group-hover:scale-100 flex gap-1.5 bg-white p-1.5 rounded-lg shadow-xl z-30 border border-gray-100 pointer-events-none group-hover:pointer-events-auto">
                            <button 
                              onClick={(e) => { e.stopPropagation(); openEditModal(book); }}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit Book"
                            >
                              <FiEdit2 size={14} />
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteBook(bookId); }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                              title="Delete Book"
                            >
                              <FiTrash2 size={14} />
                            </button>
                          </div>

                          {/* Libri Vizual (Spine) */}
                          <div 
                            className="w-full h-full rounded-sm shadow-md flex items-center justify-center relative overflow-hidden"
                            style={{ 
                              backgroundColor: spineColor,
                              boxShadow: 'inset -2px 0 5px rgba(0,0,0,0.2), 2px 2px 4px rgba(0,0,0,0.3)',
                              borderLeft: '2px solid rgba(255,255,255,0.3)',
                              borderRight: '1px solid rgba(0,0,0,0.2)'
                            }}
                          >
                            {/* Detaje të kopertinës (vijat e librit) */}
                            <div className="absolute top-3 w-full h-[2px] bg-white/20" />
                            <div className="absolute top-4 w-full h-[1px] bg-white/10" />
                            <div className="absolute bottom-5 w-full h-[3px] bg-white/20" />
                            <div className="absolute bottom-7 w-full h-[1px] bg-white/10" />
                            
                            <span 
                              className="text-slate-900 font-serif font-bold text-sm px-1 [writing-mode:vertical-rl] [text-orientation:mixed] whitespace-nowrap overflow-hidden text-ellipsis w-full text-center"
                              style={{ 
                                transform: 'rotate(180deg)',
                                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                              }}
                            >
                              {book.title}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal për Editim */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#012F4a]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-xl font-bold text-[#012F4a] flex items-center gap-2">
                <FiEdit2 className="text-[#2E7AD2]" /> Edit Book
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-colors"
              >
                <FiX size={22} />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Book Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#2E7AD2] focus:border-[#2E7AD2] outline-none transition-all shadow-sm"
                  required
                />
              </div>

              <div className="mb-8">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Spine Color
                </label>
                <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                  <input
                    type="color"
                    value={editSpineColor}
                    onChange={(e) => setEditSpineColor(e.target.value)}
                    className="w-12 h-12 rounded cursor-pointer border-2 border-white shadow-sm"
                  />
                  <div>
                    <span className="text-sm text-gray-500 font-mono bg-white px-2 py-1 rounded border shadow-sm block mb-1">
                      {editSpineColor.toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-400">Click to pick a color</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-slate-900 bg-[#2E7AD2] rounded-xl hover:bg-[#00509D] flex items-center gap-2 transition-colors shadow-md"
                >
                  <FiCheck size={18} />
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bookshelf;
