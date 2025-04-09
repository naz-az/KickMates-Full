import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent, uploadEventImage } from '../services/api';
import { formatImageUrl } from '../utils/imageUtils';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sport_type: '',
    location: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    max_players: 10,
    image_url: ''
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: parseInt(value) || 0
    });
  };
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      return;
    }
    
    const file = e.target.files[0];
    
    // Validate file type on client side
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Only image files (jpg, jpeg, png, gif, webp) are allowed.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }
    
    // Reset any previous errors
    setError(null);
    
    setSelectedImage(file);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    
    // Clear the image_url field since we're using a file upload
    setFormData({
      ...formData,
      image_url: ''
    });
  };
  
  const handleOpenFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData({
      ...formData,
      image_url: ''
    });
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    // Validate form
    if (!formData.title || !formData.sport_type || !formData.location || !formData.start_date || !formData.end_date) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    if (formData.max_players < 2) {
      setError('Event must allow at least 2 players');
      setIsSubmitting(false);
      return;
    }
    
    // Check description length
    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters long');
      setIsSubmitting(false);
      return;
    }
    
    // Combine date and time for start and end
    const start_datetime = `${formData.start_date}T${formData.start_time || '00:00'}:00`;
    const end_datetime = `${formData.end_date}T${formData.end_time || '23:59'}:00`;
    
    // Check if end date is after start date
    if (new Date(end_datetime) <= new Date(start_datetime)) {
      setError('End date and time must be after start date and time');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const eventData = {
        title: formData.title,
        description: formData.description,
        sport_type: formData.sport_type,
        location: formData.location,
        start_date: start_datetime,
        end_date: end_datetime,
        max_players: formData.max_players,
        image_url: formData.image_url // This might be empty if using file upload
      };
      
      // Create event
      const response = await createEvent(eventData);
      const eventId = response.data.event.id;
      
      // Upload image if selected
      if (selectedImage) {
        try {
          setIsUploading(true);
          await uploadEventImage(eventId, selectedImage);
          setIsUploading(false);
        } catch (uploadErr: unknown) {
          console.error('Error uploading event image:', uploadErr);
          
          // Check if it's a file type error
          // Need to handle unknown type safely
          let uploadErrorMessage = 'An unknown upload error occurred.';
          if (typeof uploadErr === 'object' && uploadErr !== null && 'response' in uploadErr) {
            // Assuming AxiosError structure for response
            const response = (uploadErr as { response?: { data?: { type?: string, message?: string } } }).response;
            if (response?.data?.type === 'invalid_file_type') {
              uploadErrorMessage = response.data.message || 'Only image files (jpg, jpeg, png, gif, webp) are allowed.';
            } else {
              uploadErrorMessage = response?.data?.message || 'Event created but image upload failed. You can edit the event to try uploading the image again.';
            }
          } else if (uploadErr instanceof Error) {
            uploadErrorMessage = uploadErr.message;
          }
          
          setError(uploadErrorMessage);
          
          // Keep the user on the page if there's an image upload error
          setIsSubmitting(false);
          return;
        }
      }
      
      navigate(`/events/${eventId}`);
    } catch (err: unknown) {
      console.error('Error creating event:', err);
      
      // Handle axios error specifically if available
      const axiosError = err as { 
        response?: { 
          data?: { 
            message?: string,
            errors?: Array<{ msg: string, path: string }>
          } 
        } 
      };
      
      if (axiosError.response?.data?.errors) {
        // Handle validation errors specifically
        const errors = axiosError.response.data.errors;
        const errorMessages = errors.map(error => {
          // Map field names to user-friendly names
          const fieldMap: Record<string, string> = {
            title: 'Title',
            description: 'Description',
            sport_type: 'Sport Type',
            location: 'Location',
            start_date: 'Start Date',
            end_date: 'End Date',
            max_players: 'Maximum Players'
          };
          
          const fieldName = fieldMap[error.path] || error.path;
          return `${fieldName}: ${error.msg}`;
        });
        
        // Join all error messages with line breaks for the alert
        setError(errorMessages.join('\n'));
      } else {
        // Handle generic errors
        const errorMessage = axiosError.response?.data?.message || (err instanceof Error ? err.message : 'Failed to create event. Please try again.');
        setError(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sportTypes = [
    'Football',
    'Basketball',
    'Tennis',
    'Volleyball',
    'Swimming',
    'Running',
    'Cycling',
    'Yoga',
    'Hiking',
    'Golf',
    'Badminton',
    'Table Tennis',
    'Cricket',
    'Rugby',
    'Pickleball',
    'Padel',
    'Other'
  ];

  return (
    <div className="create-event-page max-w-4xl mx-auto px-4 py-8">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*"
        className="hidden"
      />
    
      <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-lg p-6 mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-dark mb-2">Create a New Event</h1>
        <p className="text-text-light max-w-2xl mx-auto">Host your own sports event and find players to join you</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {error && (
          <div className="bg-error/10 text-error p-4 border-l-4 border-error">
            <div className="flex items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium">Please fix the following errors:</div>
                {error.includes('\n') ? (
                  <ul className="list-disc ml-5 mt-1 space-y-1">
                    {error.split('\n').map((err, index) => (
                      <li key={index}>{err}</li>
                    ))}
                  </ul>
                ) : (
                  <div>{error}</div>
                )}
              </div>
            </div>
          </div>
        )}
        
        <form className="p-6" onSubmit={handleSubmit}>
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-primary font-bold mr-3">1</div>
              <h3 className="text-xl font-bold text-primary-dark">Event Information</h3>
            </div>
            
            <div className="space-y-6">
              <div className="form-group">
                <label htmlFor="title" className="block text-text-dark font-medium mb-2">Event Title*</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="E.g., Weekend Football Match"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="sport_type" className="block text-text-dark font-medium mb-2">Sport Type*</label>
                <select
                  id="sport_type"
                  name="sport_type"
                  value={formData.sport_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                >
                  <option value="">Select a sport</option>
                  {sportTypes.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="description" className="block text-text-dark font-medium mb-2">
                  Description <span className="text-xs text-gray-500">(minimum 10 characters)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your event, rules, requirements, etc."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
                <div className="mt-1 text-xs text-gray-500">
                  {formData.description.length} / 5000 characters
                  {formData.description.length > 0 && formData.description.length < 10 && (
                    <span className="text-error"> (At least 10 characters required)</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-primary font-bold mr-3">2</div>
              <h3 className="text-xl font-bold text-primary-dark">Location & Schedule</h3>
            </div>
            
            <div className="space-y-6">
              <div className="form-group">
                <label htmlFor="location" className="block text-text-dark font-medium mb-2">Location*</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="E.g., Central Park, New York"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="start_date" className="block text-text-dark font-medium mb-2">Start Date*</label>
                  <input
                    type="date"
                    id="start_date"
                    name="start_date"
                    value={formData.start_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="start_time" className="block text-text-dark font-medium mb-2">Start Time*</label>
                  <input
                    type="time"
                    id="start_time"
                    name="start_time"
                    value={formData.start_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="end_date" className="block text-text-dark font-medium mb-2">End Date*</label>
                  <input
                    type="date"
                    id="end_date"
                    name="end_date"
                    value={formData.end_date}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="end_time" className="block text-text-dark font-medium mb-2">End Time*</label>
                  <input
                    type="time"
                    id="end_time"
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-6 rounded-lg mb-8">
            <div className="flex items-center mb-4">
              <div className="bg-primary/20 rounded-full w-8 h-8 flex items-center justify-center text-primary font-bold mr-3">3</div>
              <h3 className="text-xl font-bold text-primary-dark">Additional Details</h3>
            </div>
            
            <div className="space-y-6">
              <div className="form-group">
                <label htmlFor="max_players" className="block text-text-dark font-medium mb-2">
                  Maximum Participants* <span className="text-sm text-text-light">(2-100)</span>
                </label>
                <input
                  type="number"
                  id="max_players"
                  name="max_players"
                  value={formData.max_players}
                  onChange={handleNumberChange}
                  min="2"
                  max="100"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="block text-text-dark font-medium mb-2">
                  Event Image <span className="text-sm text-text-light">(Optional)</span>
                </label>
                
                <div className="space-y-4">
                  {/* Image preview */}
                  {imagePreview ? (
                    <div className="mt-2">
                      <div className="relative">
                        <img 
                          src={imagePreview} 
                          alt="Event Preview" 
                          className="rounded-lg w-full h-48 object-cover border border-gray-200" 
                        />
                        {isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-60 rounded-lg">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Image URL field */}
                      {!selectedImage && (
                        <div className="mb-4">
                          <input
                            type="url"
                            id="image_url"
                            name="image_url"
                            value={formData.image_url}
                            onChange={handleChange}
                            placeholder="https://example.com/image.jpg"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                          />
                          <p className="text-xs text-text-light mt-2">
                            Provide a URL to an image for your event, or upload your own image.
                          </p>
                          
                          {/* Show preview for URL image */}
                          {formData.image_url && (
                            <div className="mt-4">
                              <p className="text-sm font-medium mb-2">Preview:</p>
                              <div className="rounded-lg overflow-hidden border border-gray-200 h-36 w-full bg-cover bg-center" 
                                style={{backgroundImage: `url(${formatImageUrl(formData.image_url)})`}}>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Upload button */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleOpenFileDialog}
                          className="px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-text-dark hover:bg-gray-200 transition-colors flex items-center mx-auto"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          Upload Image
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-6 py-3 border border-gray-300 text-text-dark rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancel
            </button>
            
            <div className="text-center mt-8">
              <button
                type="submit"
                className={`px-8 py-3 rounded-full font-medium text-white bg-primary hover:bg-primary-dark transition-all shadow-md 
                  ${isSubmitting || (formData.description.length > 0 && formData.description.length < 10) ? 'opacity-70 cursor-not-allowed' : ''}`}
                disabled={isSubmitting || (formData.description.length > 0 && formData.description.length < 10)}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Event...
                  </span>
                ) : (
                  'Create Event'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEventPage; 