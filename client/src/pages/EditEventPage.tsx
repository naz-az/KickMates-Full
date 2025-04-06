import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getEventById, updateEvent, uploadEventImage } from '../services/api';

const EditEventPage = () => {
  const { id } = useParams<{ id: string }>();
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await getEventById(id!);
        const event = response.data.event;
        
        // Format dates and times for form inputs
        const startDate = new Date(event.start_date);
        const endDate = new Date(event.end_date);
        
        const formatDateForInput = (date: Date) => {
          return date.toISOString().split('T')[0];
        };
        
        const formatTimeForInput = (date: Date) => {
          return date.toTimeString().substring(0, 5);
        };
        
        setFormData({
          title: event.title || '',
          description: event.description || '',
          sport_type: event.sport_type || '',
          location: event.location || '',
          start_date: formatDateForInput(startDate),
          start_time: formatTimeForInput(startDate),
          end_date: formatDateForInput(endDate),
          end_time: formatTimeForInput(endDate),
          max_players: event.max_players || 10,
          image_url: event.image_url || ''
        });
      } catch (error) {
        console.error('Error fetching event details:', error);
        setError('Failed to load event details. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    if (id) {
      fetchEventDetails();
    }
  }, [id]);

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
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // Clear the image URL field when using file upload
      setFormData(prev => ({
        ...prev,
        image_url: ''
      }));
    }
  };

  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      image_url: ''
    }));
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
        image_url: formData.image_url
      };
      
      // First update event details
      await updateEvent(id!, eventData);
      
      // Then upload image if selected
      if (selectedImage) {
        setIsUploadingImage(true);
        try {
          await uploadEventImage(id!, selectedImage);
        } catch (imgErr) {
          console.error('Error uploading image:', imgErr);
          setError('Event was updated but image upload failed. Please try uploading the image again.');
          setIsSubmitting(false);
          setIsUploadingImage(false);
          return;
        } finally {
          setIsUploadingImage(false);
        }
      }
      
      navigate(`/events/${id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      setError('Failed to update event. Please try again.');
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
    'Other'
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="loading-spinner"></div>
        <p className="ml-4 text-text-light">Loading event details...</p>
      </div>
    );
  }

  return (
    <div className="edit-event-page max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-primary/10 to-primary-dark/10 rounded-lg p-6 mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary-dark mb-2">Edit Event</h1>
        <p className="text-text-light max-w-2xl mx-auto">Update your event details and settings</p>
      </div>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {error && (
          <div className="bg-error/10 text-error p-4 border-l-4 border-error">
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
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
                <label htmlFor="description" className="block text-text-dark font-medium mb-2">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your event, rules, requirements, etc."
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                />
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
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="flex flex-col space-y-4">
                  {/* Image URL input */}
                  <div>
                    <label htmlFor="image_url" className="block text-sm text-text-light mb-1">Provide an image URL:</label>
                    <input
                      type="url"
                      id="image_url"
                      name="image_url"
                      value={formData.image_url}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      disabled={!!selectedImage}
                    />
                  </div>
                  
                  <div className="text-sm text-text-light font-medium">OR</div>
                  
                  {/* File upload button */}
                  <div>
                    <button
                      type="button"
                      onClick={handleOpenFileDialog}
                      className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                      disabled={!!formData.image_url}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Image
                    </button>
                    {selectedImage && (
                      <span className="ml-2 text-sm text-text-light">
                        Selected: {selectedImage.name}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Preview section */}
                {(imagePreview || formData.image_url) && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Preview:</p>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="text-sm text-error hover:text-error-dark"
                      >
                        Remove Image
                      </button>
                    </div>
                    <div 
                      className="rounded-lg overflow-hidden border border-gray-200 h-36 w-full bg-cover bg-center" 
                      style={{backgroundImage: `url(${imagePreview || formData.image_url})`}}
                    ></div>
                  </div>
                )}
                
                <p className="text-xs text-text-light mt-2">
                  You can provide a URL to an image or upload one from your device. Leave blank for default image.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center border-t border-gray-200 pt-6">
            <button
              type="button"
              onClick={() => navigate(`/events/${id}`)}
              className="px-6 py-3 border border-gray-300 text-text-dark rounded-lg hover:bg-gray-50 transition-colors flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancel
            </button>
            
            <button
              type="submit"
              className="px-8 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
              disabled={isSubmitting || isUploadingImage}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isUploadingImage ? 'Uploading Image...' : 'Updating...'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Update Event
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditEventPage; 