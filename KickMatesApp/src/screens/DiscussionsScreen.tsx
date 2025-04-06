import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/Button';
import { getDiscussions } from '../services/api';
import { LinearGradient } from 'expo-linear-gradient';

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
  'Soccer',
  'Tennis',
  'Running',
  'Swimming',
  'Cycling',
  'Yoga',
  'Fitness',
  'Other'
];

const DiscussionsScreen = () => {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    pages: 0,
    page: 1,
    limit: 10
  });
  
  const navigation = useNavigation<any>();
  const { user } = useContext(AuthContext);
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchDiscussions();
  }, [selectedCategory, sort, page]);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params: Record<string, string | number | boolean> = {
        page,
        limit: 10
      };
      
      if (selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      
      if (sort) {
        params.sort = sort;
      }
      
      if (searchQuery) {
        params.search = searchQuery;
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

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDiscussions();
    setRefreshing(false);
  };

  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory);
    setPage(1); // Reset to first page
  };

  const handleSearch = () => {
    setPage(1); // Reset to first page
    fetchDiscussions();
  };

  const handleCreateDiscussion = () => {
    if (user) {
      navigation.navigate('CreateDiscussion');
    } else {
      navigation.navigate('Login');
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      return dateString;
    }
  };

  const renderDiscussionItem = ({ item }: { item: Discussion }) => (
    <TouchableOpacity 
      style={styles.discussionCard}
      onPress={() => navigation.navigate('DiscussionDetail', { discussionId: item.id })}
    >
      <View style={styles.discussionHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/default-avatar.png')} 
            style={styles.userAvatar} 
          />
          <View>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.postedDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      
      <Text style={styles.discussionTitle}>{item.title}</Text>
      <Text style={styles.discussionContent} numberOfLines={3}>{item.content}</Text>
      
      {item.image_url && (
        <Image 
          source={{ uri: item.image_url }} 
          style={styles.discussionImage} 
          resizeMode="cover"
        />
      )}
      
      <View style={styles.discussionFooter}>
        <View style={styles.votes}>
          <TouchableOpacity style={styles.voteButton}>
            <Ionicons name="arrow-up-outline" size={18} color="#4F46E5" />
            <Text style={styles.voteCount}>{item.votes_up}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.voteButton}>
            <Ionicons name="arrow-down-outline" size={18} color="#EF4444" />
            <Text style={styles.voteCount}>{item.votes_down}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.comments}>
          <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
          <Text style={styles.commentCount}>{item.comment_count} comments</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }: { item: string }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        selectedCategory === item && styles.categoryButtonSelected
      ]}
      onPress={() => handleCategoryChange(item)}
    >
      <Text 
        style={[
          styles.categoryButtonText,
          selectedCategory === item && styles.categoryButtonTextSelected
        ]}
      >
        {item}
      </Text>
    </TouchableOpacity>
  );

  const renderPagination = () => {
    const buttons = [];
    const maxButtons = 5;
    let startPage = Math.max(1, pagination.page - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.pages, startPage + maxButtons - 1);
    
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <TouchableOpacity
          key={`page-${i}`}
          style={[
            styles.pageButton,
            pagination.page === i && styles.pageButtonActive
          ]}
          onPress={() => setPage(i)}
          disabled={pagination.page === i}
        >
          <Text 
            style={[
              styles.pageButtonText,
              pagination.page === i && styles.pageButtonTextActive
            ]}
          >
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, styles.pageButtonNav]}
          onPress={() => setPage(Math.max(1, page - 1))}
          disabled={page === 1}
        >
          <Ionicons name="chevron-back" size={18} color={page === 1 ? "#D1D5DB" : "#4F46E5"} />
        </TouchableOpacity>
        
        {buttons}
        
        <TouchableOpacity
          style={[styles.pageButton, styles.pageButtonNav]}
          onPress={() => setPage(Math.min(pagination.pages, page + 1))}
          disabled={page === pagination.pages}
        >
          <Ionicons name="chevron-forward" size={18} color={page === pagination.pages ? "#D1D5DB" : "#4F46E5"} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <LinearGradient
            colors={['#4F46E5', '#7C3AED']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientText}
          >
            <Text style={styles.headerTitle}>Discussions</Text>
          </LinearGradient>
          <Text style={styles.headerSubtitle}>Join conversations, share ideas, and connect with others</Text>
        </View>
        <Button
          title="New Discussion"
          onPress={handleCreateDiscussion}
          icon={<Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />}
        />
      </View>
      
      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          data={CATEGORIES}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search discussions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        
        <View style={styles.sortContainer}>
          <Text style={styles.sortLabel}>Sort by:</Text>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setSort(sort === 'newest' ? 'popular' : 'newest')}
          >
            <Text style={styles.sortButtonText}>{sort === 'newest' ? 'Newest' : 'Popular'}</Text>
            <Ionicons name="chevron-down" size={16} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Discussions List */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={24} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={fetchDiscussions}
            variant="outline"
          />
        </View>
      ) : (
        <FlatList
          data={discussions}
          renderItem={renderDiscussionItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.discussionsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No discussions found</Text>
              <Text style={styles.emptySubtext}>Be the first to start a discussion!</Text>
              <Button
                title="Start New Discussion"
                onPress={handleCreateDiscussion}
                style={styles.createButton}
              />
            </View>
          }
          ListFooterComponent={
            pagination.pages > 1 ? renderPagination() : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  gradientText: {
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  categoriesContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  categoryButtonSelected: {
    backgroundColor: '#4F46E5',
  },
  categoryButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  categoryButtonTextSelected: {
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#111827',
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  sortLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#4B5563',
    marginRight: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginVertical: 8,
  },
  discussionsList: {
    padding: 16,
  },
  discussionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  discussionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  postedDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#EEF2FF',
  },
  categoryText: {
    fontSize: 12,
    color: '#4F46E5',
  },
  discussionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  discussionContent: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 12,
  },
  discussionImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  discussionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  votes: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  voteCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  comments: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentCount: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  pageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  pageButtonActive: {
    backgroundColor: '#4F46E5',
  },
  pageButtonNav: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pageButtonText: {
    fontSize: 14,
    color: '#4B5563',
  },
  pageButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  createButton: {
    marginTop: 8,
  },
});

export default DiscussionsScreen; 