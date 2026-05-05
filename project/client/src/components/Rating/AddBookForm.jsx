import { FiBook, FiPlus, FiChevronDown } from 'react-icons/fi';

const AddBookForm = ({ 
  addTitle = '', 
  setAddTitle, 
  addSpineColor = '#2e7ad2', 
  setAddSpineColor, 
  handleAddBook, 
  isLoading, 
  error 
}) => {
  const presetColors = [
    '#fd7f2f', '#d35400', // Warm colors
    '#3fa34d', '#27ae60', // Greens
    '#8e44ad', '#e91e63', // Purples/Pinks
    '#f39c12', '#f1c40f', // Yellows
    '#1abc9c', '#3498db'  // Teals/Blues
  ];

  const currentColor = addSpineColor || '#2e7ad2';

  return (
    <div className="mb-6 p-6 bg-white rounded-xl max-w-2xl mx-auto border border-[#2E7AD2]/30 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center mb-5">
        <div className="bg-gradient-to-br bg-[#2E7AD2] p-2 rounded-lg mr-3">
          <FiBook className="text-white text-lg" />
        </div>
        <h2 className="text-xl font-bold text-[#2E7AD2] bg-clip-text text-transparent bg-gradient-to-r bg-[#2E7AD2]">
          Add New Book
        </h2>
      </div>
      
      {error && (
        <div className="mb-5 p-3 bg-red-50 text-red-700 rounded-lg border border-red-100 text-sm animate-pulse">
          {error}
        </div>
      )}
      
      <form onSubmit={handleAddBook}>
        {/* Enhanced Title Input */}
        <div className="mb-6">
          <label className="block text-[#012F4a] mb-2 font-medium" htmlFor="title">
            Book Title <span className="text-[#fd7f2f]">*</span>
          </label>
          <input
            id="title"
            type="text"
            value={addTitle}
            onChange={(e) => setAddTitle(e.target.value)}
            className="w-full px-4 py-3 border border-[#90caf9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7ad2] focus:border-transparent transition-all shadow-sm"
            required
            placeholder="Enter book title"
          />
        </div>
        
        {/* Enhanced Spine Customization Section */}
        <div className="mb-6">
          <label className="block text-[#012F4a] mb-3 font-medium">
            Spine Color
          </label>
          
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Enhanced Color Selection Column */}
            <div className="flex-1 w-full space-y-5">
              {/* Enhanced Preset Color Grid */}
              <div>
                <div className="grid grid-cols-5 gap-3">
                  {presetColors.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAddSpineColor(color)}
                      className={`w-full h-9 rounded-lg border-2 transition-transform hover:scale-105 ${currentColor === color ? 'border-[#012F4a] scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: color }}
                      aria-label={`Select ${color}`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Enhanced Custom Color Picker */}
              <div>
                <label className="block text-[#00509d] text-sm mb-2 font-medium">
                  OR choose custom color:
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={currentColor}
                    onChange={(e) => setAddSpineColor(e.target.value)}
                    className="w-10 h-10 cursor-pointer rounded-lg border border-[#90caf9] shadow-sm hover:shadow-md transition-shadow"
                    id="spineColorPicker"
                  />
                  <span className="ml-2 text-sm text-[#00509d] font-medium px-3 py-1 bg-[#f0f9ff] rounded-lg">
                    {currentColor.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Enhanced Spine Preview Column */}
            <div className="flex-1 w-full">
              <div className="flex flex-col items-center">
                <div className="relative w-full h-40 flex items-end justify-center">
                  <div 
                    className="relative h-5/6 w-14 flex items-end justify-center rounded-lg border-l border-l-white/30 border-r border-r-gray-400/20 shadow-md transition-transform hover:scale-105"
                    style={{ 
                      backgroundColor: currentColor,
                      boxShadow: '2px 2px 5px rgba(0,0,0,0.2)'
                    }}
                  >
                    <span 
                      className="text-white font-serif font-bold px-1 [writing-mode:vertical-rl] [text-orientation:mixed] origin-center whitespace-nowrap overflow-hidden text-ellipsis text-sm leading-tight mb-2"
                      style={{ 
                        transform: 'rotate(180deg)',
                        fontFamily: "'Georgia', serif",
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                      }}
                    >
                      {addTitle || 'Your Book Title'}
                    </span>
                  </div>
                  {/* <div className="absolute bottom-0 left-0 right-0 h-2 bg-gradient-to-r from-[#fd7f2f] to-[#d35400] rounded-b-lg"></div> */}
                </div>
                <p className="text-sm text-[#012F4a] mt-2 font-medium">Preview</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full px-6 py-3 rounded-xl text-white bg-[#2E7AD2] hover:bg-[#00509D] transition-all shadow-md hover:shadow-lg disabled:opacity-70 flex items-center justify-center text-base font-medium`}
        >
          {isLoading ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </span>
          ) : (
            <>
              <FiPlus className="mr-2" size={18} />
              Add Book
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default AddBookForm;