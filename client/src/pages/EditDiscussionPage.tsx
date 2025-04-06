import { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getDiscussionById, updateDiscussion, uploadDiscussionImage } from '../services/api';
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

const EditDiscussionPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    category?: string;
    content?: string;
    image?: string;
  }>({});
  
  // Load discussion data
  useEffect(() => {
    const fetchDiscussion = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await getDiscussionById(id);
        const discussion = response.data.discussion;
        
        // Check if the current user is the creator
        if (user?.id !== discussion.creator_id) {
          setError('You do not have permission to edit this discussion');
          return;
        }
        
        // Set form values
        setTitle(discussion.title);
        setCategory(discussion.category);
        setContent(discussion.content);
        
        // Set current image if exists
        if (discussion.image_url) {
          setCurrentImage(discussion.image_url);
        }
      } catch (err) {
        console.error('Error fetching discussion:', err);
        setError('Failed to load the discussion. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscussion();
  }, [id, user]);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file) {
      // Validate file type
      if (!file.type.match('image.*')) {
        setFormErrors({ ...formErrors, image: 'Please select an image file (JPEG, PNG, etc.)' });
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setFormErrors({ ...formErrors, image: 'Image size should be less than 5MB' });
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
      setFormErrors({ ...formErrors, image: undefined });
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
  
  // Keep current image
  const handleKeepCurrentImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Remove current image
  const handleRemoveCurrentImage = () => {
    setCurrentImage(null);
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
    
    setFormErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !id) {
      navigate('/discussions');
      return;
    }
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Update the discussion
      const updateData: Record<string, unknown> = {
        title: title.trim(),
        content: content.trim(),
        category
      };
      
      // If current image was removed, set image_url to null
      if (currentImage === null) {
        updateData.image_url = null;
      }
      
      await updateDiscussion(id, updateData);
      
      // Upload new image if selected
      if (selectedFile) {
        await uploadDiscussionImage(id, selectedFile);
      }
      
      // Redirect to the discussion
      navigate(`/discussions/${id}`);
    } catch (err: any) {
      console.error('Error updating discussion:', err);
      setSubmitting(false);
      
      // Handle API errors
      if (err.response?.data?.message) {
        alert(`Error: ${err.response.data.message}`);
      } else {
        alert('An error occurred while updating the discussion. Please try again.');
      }
    }
  };
  
  if (loading) {
    return (
      <div className="loading-container my-12 flex justify-center">
        <div className="loader animate-spin w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container my-12 text-center p-8 bg-white rounded-lg shadow-md">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-500 text-lg mb-4">{error}</p>
        <Link to="/discussions" className="btn bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md">
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Discussions</span>
          </div>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="edit-discussion-page max-w-3xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg shadow-lg p-6 mb-8">
        <h1 className="text-3xl font-bold text-white text-center">Edit Discussion</h1>
        <p className="text-indigo-100 mt-2 text-center">Refine your ideas and continue the conversation</p>
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
            className={`input input-bordered w-full transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.title ? 'input-error' : ''}`}
          />
          {formErrors.title && (
            <span className="text-error text-sm mt-1">{formErrors.title}</span>
          )}
        </div>
        
        {/* Category */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">Category</span>
          </label>
          <div className="bg-white rounded-lg border border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500 transition-all duration-200 ${formErrors.category ? 'border-red-500' : ''}">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select w-full border-none shadow-none focus:outline-none bg-transparent ${formErrors.category ? 'text-red-500' : ''}"
            >
              <option value="" disabled>Select a category</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          {formErrors.category && (
            <span className="text-error text-sm mt-1">{formErrors.category}</span>
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
            className={`textarea textarea-bordered w-full min-h-[200px] transition-all duration-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${formErrors.content ? 'textarea-error' : ''}`}
          ></textarea>
          {formErrors.content && (
            <span className="text-error text-sm mt-1">{formErrors.content}</span>
          )}
          <div className="text-xs text-gray-500 mt-1 flex justify-between">
            <span>{content.length} characters</span>
            <span>{content.length < 20 ? `${20 - content.length} more to go` : 'Minimum length met ✓'}</span>
          </div>
        </div>
        
        {/* Current Image */}
        {currentImage && (
          <div className="form-control">
            <label className="label">
              <span className="label-text font-medium text-gray-700">Current Image</span>
            </label>
            
            <div className="current-image-preview mt-2 relative rounded-lg border border-gray-200 overflow-hidden shadow-md">
              <img 
                src={currentImage} 
                alt="Current" 
                className="max-h-64 w-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80";
                }} 
              />
              <button
                type="button"
                onClick={handleRemoveCurrentImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors shadow-md"
                aria-label="Remove image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
        
        {/* Image Upload */}
        <div className="form-control">
          <label className="label">
            <span className="label-text font-medium text-gray-700">
              {currentImage ? 'Replace Image (Optional)' : 'Add Image (Optional)'}
            </span>
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
          
          {formErrors.image && (
            <span className="text-error text-sm mt-1">{formErrors.image}</span>
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
              onClick={() => navigate(`/discussions/${id}`)}
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
                  <span>Updating...</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                  <span>Update Discussion</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditDiscussionPage; 