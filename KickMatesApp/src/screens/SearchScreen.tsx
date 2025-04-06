import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Keyboard,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { searchAll, searchEvents, searchUsers, searchDiscussions } from '../services/api';
import { format } from 'date-fns';

// Dummy placeholder image (you'd use actual user/event images in production)
const PLACEHOLDER_IMAGE = 'https://via.placeholder.com/100';

interface SearchItem {
  id: number;
  type: 'event' | 'user' | 'discussion';
  title?: string;
  name?: string;
  username?: string;
  image?: string;
  avatar?: string;
  location?: string;
  date?: string;
  participants_count?: number;
  bio?: string;
  topic?: string;
  comments_count?: number;
  description?: string;
}

interface SearchResult {
  events: SearchItem[];
  users: SearchItem[];
  discussions: SearchItem[];
}

const SearchScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'events' | 'people' | 'discussions'>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<SearchResult>({
    events: [],
    users: [],
    discussions: []
  });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  
  useEffect(() => {
    // Load recent searches from AsyncStorage or other storage
    loadRecentSearches();
  }, []);
  
  const loadRecentSearches = async () => {
    // In a real app, you would load from AsyncStorage
    setRecentSearches([
      'basketball',
      'tennis club',
      'soccer tomorrow',
      'volleyball beginners'
    ]);
  };
  
  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    Keyboard.dismiss();
    
    try {
      let searchResults;
      
      switch (activeTab) {
        case 'events':
          const eventsResponse = await searchEvents(query);
          searchResults = {
            events: eventsResponse.data.events,
            users: [],
            discussions: []
          };
          break;
        case 'people':
          const usersResponse = await searchUsers(query);
          searchResults = {
            events: [],
            users: usersResponse.data.users,
            discussions: []
          };
          break;
        case 'discussions':
          const discussionsResponse = await searchDiscussions(query);
          searchResults = {
            events: [],
            users: [],
            discussions: discussionsResponse.data.discussions
          };
          break;
        default:
          // 'all' tab
          const allResponse = await searchAll(query);
          searchResults = allResponse.data;
      }
      
      setResults(searchResults);
      
      // Add to recent searches if not already included
      if (!recentSearches.includes(query)) {
        const updatedSearches = [query, ...recentSearches.slice(0, 4)];
        setRecentSearches(updatedSearches);
        // In a real app, save to AsyncStorage here
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleClearSearch = () => {
    setSearchQuery('');
    setResults({
      events: [],
      users: [],
      discussions: []
    });
  };
  
  const navigateToItem = (item: SearchItem) => {
    switch (item.type) {
      case 'event':
        // @ts-ignore
        navigation.navigate('EventsTab', {
          screen: 'EventDetail',
          params: { id: item.id.toString() }
        });
        break;
      case 'user':
        // @ts-ignore
        navigation.navigate('ProfileTab', {
          screen: 'UserProfile',
          params: { id: item.id.toString() }
        });
        break;
      case 'discussion':
        // @ts-ignore
        navigation.navigate('DiscussionsTab', {
          screen: 'DiscussionDetail',
          params: { id: item.id.toString() }
        });
        break;
    }
  };
  
  const renderSearchItem = ({ item }: { item: SearchItem }) => {
    switch (item.type) {
      case 'event':
        return (
          <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => navigateToItem(item)}
          >
            <Image 
              source={{ uri: item.image || PLACEHOLDER_IMAGE }} 
              style={styles.eventImage}
            />
            
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
              
              <View style={styles.itemDetailsRow}>
                <Ionicons name="location" size={14} color="#6B7280" />
                <Text style={styles.itemDetailText} numberOfLines={1}>{item.location}</Text>
              </View>
              
              <View style={styles.itemDetailsRow}>
                <Ionicons name="calendar" size={14} color="#6B7280" />
                <Text style={styles.itemDetailText}>
                  {item.date ? format(new Date(item.date), 'MMM d, yyyy') : 'TBD'}
                </Text>
                
                <Ionicons name="people" size={14} color="#6B7280" style={{ marginLeft: 8 }} />
                <Text style={styles.itemDetailText}>
                  {item.participants_count || 0} participants
                </Text>
              </View>
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        );
        
      case 'user':
        return (
          <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => navigateToItem(item)}
          >
            <Image 
              source={{ uri: item.avatar || PLACEHOLDER_IMAGE }} 
              style={styles.userAvatar}
            />
            
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemSubtitle} numberOfLines={1}>@{item.username}</Text>
              
              {item.bio ? (
                <Text style={styles.itemDescription} numberOfLines={1}>
                  {item.bio}
                </Text>
              ) : null}
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        );
        
      case 'discussion':
        return (
          <TouchableOpacity 
            style={styles.resultItem}
            onPress={() => navigateToItem(item)}
          >
            <View style={styles.discussionIcon}>
              <Ionicons name="chatbubbles" size={20} color="#4F46E5" />
            </View>
            
            <View style={styles.itemContent}>
              <Text style={styles.itemTitle} numberOfLines={1}>{item.topic}</Text>
              
              <View style={styles.itemDetailsRow}>
                <Ionicons name="chatbox" size={14} color="#6B7280" />
                <Text style={styles.itemDetailText}>
                  {item.comments_count || 0} comments
                </Text>
              </View>
              
              {item.description ? (
                <Text style={styles.itemDescription} numberOfLines={1}>
                  {item.description}
                </Text>
              ) : null}
            </View>
            
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        );
    }
  };
  
  const renderRecentSearches = () => {
    if (searchQuery || (results.events.length > 0 || results.users.length > 0 || results.discussions.length > 0)) {
      return null;
    }
    
    return (
      <View style={styles.recentSearchesContainer}>
        <View style={styles.recentSearchesHeader}>
          <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
          <TouchableOpacity onPress={() => setRecentSearches([])}>
            <Text style={styles.clearRecentText}>Clear</Text>
          </TouchableOpacity>
        </View>
        
        {recentSearches.map((search, index) => (
          <TouchableOpacity
            key={index}
            style={styles.recentSearchItem}
            onPress={() => {
              setSearchQuery(search);
              handleSearch(search);
            }}
          >
            <Ionicons name="time-outline" size={18} color="#6B7280" />
            <Text style={styles.recentSearchText}>{search}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  
  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      {['all', 'events', 'people', 'discussions'].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[
            styles.tab,
            activeTab === tab && styles.activeTab
          ]}
          onPress={() => {
            setActiveTab(tab as any);
            if (searchQuery) handleSearch();
          }}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
  
  const renderResultsHeader = () => {
    if (!searchQuery || isSearching) return null;
    
    const totalResults = results.events.length + results.users.length + results.discussions.length;
    
    if (totalResults === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={48} color="#D1D5DB" />
          <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
          <Text style={styles.noResultsSubtext}>Try different keywords or check your spelling</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {totalResults} {totalResults === 1 ? 'result' : 'results'} found
        </Text>
      </View>
    );
  };
  
  const getResultsData = () => {
    if (activeTab === 'all') {
      return [
        ...results.events.map(item => ({ ...item, type: 'event' })),
        ...results.users.map(item => ({ ...item, type: 'user' })),
        ...results.discussions.map(item => ({ ...item, type: 'discussion' }))
      ];
    } else if (activeTab === 'events') {
      return results.events.map(item => ({ ...item, type: 'event' }));
    } else if (activeTab === 'people') {
      return results.users.map(item => ({ ...item, type: 'user' }));
    } else {
      return results.discussions.map(item => ({ ...item, type: 'discussion' }));
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for events, people, discussions..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            onSubmitEditing={() => handleSearch()}
            autoCapitalize="none"
          />
          
          {searchQuery ? (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {renderTabs()}
      </View>
      
      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <>
          {renderRecentSearches()}
          {renderResultsHeader()}
          
          <FlatList
            data={getResultsData()}
            renderItem={renderSearchItem}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            contentContainerStyle={styles.resultsList}
            ListFooterComponent={
              searchQuery && getResultsData().length > 0 ? (
                <Text style={styles.endOfResults}>End of results</Text>
              ) : null
            }
          />
        </>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
    height: '100%',
  },
  clearButton: {
    padding: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginTop: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4F46E5',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#4F46E5',
  },
  recentSearchesContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    borderRadius: 8,
    marginHorizontal: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  recentSearchesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  clearRecentText: {
    fontSize: 14,
    color: '#4F46E5',
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  recentSearchText: {
    fontSize: 14,
    color: '#4B5563',
    marginLeft: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 8,
    color: '#6B7280',
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  resultsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsCount: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultsList: {
    paddingBottom: 20,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  eventImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  discussionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  itemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  itemDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  itemDetailText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 4,
    marginRight: 8,
  },
  itemDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  endOfResults: {
    textAlign: 'center',
    padding: 16,
    color: '#9CA3AF',
    fontSize: 14,
  },
});

export default SearchScreen; 