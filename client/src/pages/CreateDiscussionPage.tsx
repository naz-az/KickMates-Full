import { useState, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDiscussion, uploadDiscussionImage } from '../services/api';
import { AuthContext } from '../context/AuthContext';

const CATEGORIES = [
  'Basketball',
  'Football',
  'Soccer',
  'Tennis',
  'Running',
  'Swimming',
  'Cycling',
  'Yoga',
  'Fitness',
  'Other'
];

const CreateDiscussionPage = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    title?: string;
    category?: string;
    content?: string;
    image?: string;
  }>({});
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setErrors({ ...errors, image: 'Please select an image file (JPEG, PNG, etc.)' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, image: 'Image size should be less than 5MB' });
        return;
      }
      
      setSelectedFile(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear previous error
      setErrors({ ...errors, image: undefined });
    } else {
      setSelectedFile(null);
      setImagePreview(null);
    }
  };
  
  // Remove selected image
  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Validate form
  const validateForm = () => {
    const newErrors: {
      title?: string;
      category?: string;
      content?: string;
    } = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (title.length < 5) {
      newErrors.title = 'Title should be at least 5 characters';
    }
    
    if (!category) {
      newErrors.category = 'Please select a category';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Content is required';
    } else if (content.length < 20) {
      newErrors.content = 'Content should be at least 20 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { state: { from: '/discussions/create' } });
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Create the discussion
      const response = await createDiscussion({
        title: title.trim(),
        content: content.trim(),
        category
      });
      
      const discussionId = response.data.discussion.id;
      
      // Upload image if selected
      if (selectedFile && discussionId) {
        await uploadDiscussionImage(discussionId, selectedFile);
      }
      
      // Redirect to the new discussion
      navigate(`/discussions/${discussionId}`);
    } catch (err: any) {
      console.error('Error creating discussion:', err);
      setSubmitting(false);
      
      // Handle API errors
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert('An error occurred while creating the discussion. Please try again.');
      }
    }
  };
  
  return (
    <div className="create-discussion-page max-w-3xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-white text-center">Start a New Discussion</h1>
        <p className="text-indigo-100 mt-2 text-center">Share your thoughts with the community and start engaging conversations.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-xl border border-gray-200 p-8">
        {/* Title */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a descriptive title"
            className={`input input-bordered w-full transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.title ? 'input-error' : ''}`}
          />
          {errors.title && (
            <span className="text-error text-sm mt-1">{errors.title}</span>
          )}
        </div>
        
        {/* Category */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Category</span>
          </label>
          <div className="bg-white rounded-lg border border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200 ${errors.category ? 'border-red-500' : ''}">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select w-full border-none shadow-none focus:outline-none bg-transparent ${errors.category ? 'text-red-500' : ''}"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {errors.category && (
            <span className="text-error text-sm mt-1">{errors.category}</span>
          )}
        </div>
        
        {/* Content */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Content</span>
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, ask a question, or start a conversation..."
            className={`textarea textarea-bordered w-full min-h-[200px] transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${errors.content ? 'textarea-error' : ''}`}
          ></textarea>
          {errors.content && (
            <span className="text-error text-sm mt-1">{errors.content}</span>
          )}
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>{content.length} characters</span>
            <span>{content.length < 20 ? `${20 - content.length} more to go` : 'Minimum length met ✓'}</span>
          </div>
        </div>
        
        {/* Image Upload */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Image (Optional)</span>
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors hover:border-indigo-500">
            <div className="flex flex-col items-center">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="file-input file-input-bordered w-full"
              />
              <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 5MB</p>
            </div>
          </div>
          
          {errors.image && (
            <span className="text-error text-sm mt-1">{errors.image}</span>
          )}
          
          {imagePreview && (
            <div className="image-preview mt-4 relative rounded-lg border border-gray-200 overflow-hidden shadow-md">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-64 w-full object-contain" 
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-md"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        {/* Submit Button */}
        <div className="form-control mt-8">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => navigate('/discussions')}
              className="btn btn-outline mr-2 hover:bg-gray-100"
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                <span>Cancel</span>
              </div>
            </button>
            
            <button
              type="submit"
              disabled={submitting}
              className="btn bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700"
            >
              {submitting ? (
                <div className="flex items-center">
                  <span className="loading loading-spinner loading-sm mr-2"></span>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Create Discussion</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateDiscussionPage; 