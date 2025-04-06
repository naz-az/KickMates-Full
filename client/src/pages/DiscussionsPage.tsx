import { useState, useEffect, useContext } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getDiscussions } from '../services/api';
import { AuthContext } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Discussion {
  id: number;
  title: string;
  content: string;
  category: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  username: string;
  profile_image?: string;
  votes_up: number;
  votes_down: number;
  comment_count: number;
  image_url?: string;
}

const CATEGORIES = [
  'All',
  'Basketball',
  'Football',
  'Pickleball',
  'Padel',
  'Soccer',
  'Tennis',
  'Running',
  'Swimming',
  'Cycling',
  'Yoga',

  'Other'
];

const DiscussionsPage = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Get query parameters
  const category = searchParams.get('category') || 'All';
  const sort = searchParams.get('sort') || 'newest';
  const search = searchParams.get('search') || '';
  const page = Number(searchParams.get('page') || '1');
  
  // Pagination state
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });
  
  // Load discussions
  useEffect(() => {
    const fetchDiscussions = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Build query parameters
        const params: Record<string, string | number | boolean> = {
          page,
          limit: 10
        };
        
        if (category !== 'All') {
          params.category = category;
        }
        
        if (sort) {
          params.sort = sort;
        }
        
        if (search) {
          params.search = search;
        }
        
        const response = await getDiscussions(params);
        setDiscussions(response.data.discussions);
        setPagination(response.data.pagination);
      } catch (err) {
        console.error('Error fetching discussions:', err);
        setError('Failed to load discussions. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDiscussions();
  }, [category, sort, search, page]);
  
  // Handle category change
  const handleCategoryChange = (newCategory: string) => {
    searchParams.set('category', newCategory);
    searchParams.set('page', '1'); // Reset to first page
    setSearchParams(searchParams);
  };
  
  // Handle sort change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    searchParams.set('sort', e.target.value);
    searchParams.set('page', '1'); // Reset to first page
    setSearchParams(searchParams);
  };
  
  // Handle search
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const searchTerm = formData.get('search') as string;
    
    searchParams.set('search', searchTerm);
    searchParams.set('page', '1'); // Reset to first page
    setSearchParams(searchParams);
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    searchParams.set('page', newPage.toString());
    setSearchParams(searchParams);
    
    // Scroll to top on page change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  // Create new discussion
  const handleCreateDiscussion = () => {
    if (user) {
      navigate('/discussions/create');
    } else {
      navigate('/login', { state: { from: '/discussions/create' } });
    }
  };
  
  // Format date
  const formatDate = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return dateString;
    }
  };
  
  return (
    <div className="discussions-page max-w-6xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="page-header flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div className="text-center sm:text-left w-full sm:w-auto">
          <h1 className="text-3xl font-bold text-gray-800">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">Discussions</span>
          </h1>
          <p className="text-gray-600 mt-1">Join conversations, share ideas, and connect with others</p>
        </div>
        <button 
          onClick={handleCreateDiscussion}
          className="btn btn-md bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md w-full sm:w-auto"
        >
          <div className="flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Start New Discussion</span>
          </div>
        </button>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        {/* Categories */}
        <div className="categories-container w-full bg-white rounded-lg shadow-md p-4">
          <div className="categories flex space-x-2 pb-2 overflow-x-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`category-btn whitespace-nowrap px-4 py-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                  category === cat
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md transform scale-105'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                }`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {/* Sort dropdown */}
        <div className="w-full sm:w-1/3 md:w-1/4">
          <div className="bg-white rounded-lg shadow-md p-3">
            <select
              value={sort}
              onChange={handleSortChange}
              className="select w-full border-none shadow-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
              aria-label="Sort discussions"
            >
              <option value="newest">Newest</option>
              <option value="popular">Most Popular</option>
              <option value="comments">Most Comments</option>
            </select>
          </div>
        </div>
        
        {/* Search bar */}
        <div className="w-full sm:w-2/3 md:w-3/4">
          <form onSubmit={handleSearch} className="flex w-full">
            <div className="relative flex w-full bg-white rounded-lg shadow-md">
              <input
                type="text"
                name="search"
                placeholder="Search discussions..."
                defaultValue={search}
                className="input w-full border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent px-4 py-3"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center justify-center p-2 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700"
                aria-label="Search"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Loading state */}
      {loading && (
        <div className="loading-container my-12 flex justify-center">
          <div className="loader animate-spin w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
        </div>
      )}
      
      {/* Error state */}
      {!loading && error && (
        <div className="error-container my-12 text-center p-8 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-500 text-lg mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md"
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Try Again</span>
            </div>
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {!loading && !error && discussions.length === 0 && (
        <div className="empty-state my-12 text-center p-8 bg-white rounded-lg shadow-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold mb-2">No discussions found</h3>
          {search && (
            <p className="mb-4 text-gray-600">
              No discussions match your search for "<span className="font-medium">{search}</span>".
            </p>
          )}
          {category !== 'All' && (
            <p className="mb-4 text-gray-600">
              No discussions found in the <span className="font-medium">{category}</span> category.
            </p>
          )}
          <button 
            onClick={handleCreateDiscussion} 
            className="btn bg-gradient-to-r from-indigo-600 to-purple-600 border-0 text-white hover:from-indigo-700 hover:to-purple-700 mt-4"
          >
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Start the first discussion!</span>
            </div>
          </button>
        </div>
      )}
      
      {/* Discussion list */}
      {!loading && !error && discussions.length > 0 && (
        <div className="discussions-list space-y-6">
          {discussions.map((discussion) => (
            <div key={discussion.id} className="discussion-card bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <Link to={`/discussions/${discussion.id}`} className="block">
                <div className="flex flex-col md:flex-row">
                  {/* Vote column */}
                  <div className="vote-column flex flex-row md:flex-col items-center justify-center p-4 bg-gradient-to-b from-indigo-50 to-purple-50 md:w-24">
                    <div className="vote-count text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                      {discussion.votes_up - discussion.votes_down}
                    </div>
                    <div className="vote-label text-sm text-gray-500">votes</div>
                  </div>
                  
                  {/* Content */}
                  <div className="content flex-1 p-4 md:p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-800 hover:text-indigo-600 transition-colors pr-2">
                          {discussion.title}
                        </h3>
                        <div className="meta text-sm text-gray-500 mt-2">
                          <span className={`category inline-block text-white rounded text-xs px-3 min-w-20 text-center h-6 flex items-center justify-center mb-2 ${
                            discussion.category === 'Basketball' ? 'bg-orange-500' :
                            discussion.category === 'Football' ? 'bg-blue-600' :
                            discussion.category === 'Soccer' ? 'bg-green-600' :
                            discussion.category === 'Tennis' ? 'bg-yellow-500' :
                            discussion.category === 'Running' ? 'bg-red-500' :
                            discussion.category === 'Swimming' ? 'bg-cyan-500' :
                            discussion.category === 'Cycling' ? 'bg-lime-600' :
                            discussion.category === 'Yoga' ? 'bg-purple-500' :
                            discussion.category === 'Fitness' ? 'bg-pink-500' :
                            'bg-gray-600' // Other or fallback
                          }`}>
                            {discussion.category}
                          </span>
                          <div className="flex items-center gap-1 mt-4">
                            {discussion.profile_image ? (
                              <img 
                                src={discussion.profile_image} 
                                alt={discussion.username} 
                                className="w-5 h-5 rounded-full"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.onerror = null;
                                  target.src = "https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80";
                                }}
                              />
                            ) : (
                              <img 
                                src="https://images.unsplash.com/photo-1511367461989-f85a21fda167?auto=format&fit=crop&w=100&q=80" 
                                alt={discussion.username} 
                                className="w-5 h-5 rounded-full"
                              />
                            )}
                            <span>
                              Posted by <span className="font-medium text-indigo-600">{discussion.username}</span> {formatDate(discussion.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {discussion.image_url && (
                        <div className="discussion-image-preview w-20 h-20 md:w-24 md:h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200 shadow-sm">
                          <img 
                            src={discussion.image_url} 
                            alt={discussion.title} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=300&q=80";
                            }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <p className="content-preview text-gray-600 line-clamp-2 mt-3 mb-4">
                      {discussion.content}
                    </p>
                    
                    <div className="flex justify-between items-center">
                      <div className="stats flex items-center text-sm text-gray-500">
                        <div className="comments-count flex items-center mr-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                          </svg>
                          {discussion.comment_count} comments
                        </div>
                        <div className="votes-breakdown flex items-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          {discussion.votes_up}
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          {discussion.votes_down}
                        </div>
                      </div>
                      
                      <div className="read-more text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center">
                        Read more
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      
      {/* Pagination */}
      {!loading && !error && pagination.pages > 1 && (
        <div className="pagination flex justify-center my-10">
          <div className="inline-flex rounded-md shadow-sm">
            <button
              className="px-4 py-2 text-sm font-medium text-indigo-500 bg-white border border-indigo-200 rounded-l-md hover:bg-indigo-50 focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Page buttons */}
            {Array.from({ length: pagination.pages }, (_, i) => i + 1)
              .filter(p => {
                // Show first page, last page, current page and 1 page before and after current
                return (
                  p === 1 ||
                  p === pagination.pages ||
                  p === pagination.page ||
                  p === pagination.page - 1 ||
                  p === pagination.page + 1
                );
              })
              .map((p, i, arr) => (
                <div key={p} className="inline-flex">
                  {i > 0 && arr[i - 1] !== p - 1 && (
                    <span className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-indigo-200">
                      ...
                    </span>
                  )}
                  <button
                    className={`relative inline-flex items-center px-4 py-2 text-sm font-medium ${
                      p === pagination.page
                        ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                        : 'bg-white border-indigo-200 text-gray-500 hover:bg-indigo-50'
                    } border`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                </div>
              ))}
            
            <button
              className="px-4 py-2 text-sm font-medium text-indigo-500 bg-white border border-indigo-200 rounded-r-md hover:bg-indigo-50 focus:z-10 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50 disabled:pointer-events-none"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.pages}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionsPage; 