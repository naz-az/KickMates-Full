import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  TextInput,
  Modal,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EventsStackParamList } from '../navigation/AppNavigator';
import { getEvents } from '../services/api';
import EventCard from '../components/EventCard';
import Button from '../components/Button';

type EventsScreenNavigationProp = NativeStackNavigationProp<EventsStackParamList, 'CreateEvent'>;

// Sport options for the filter
const sportOptions = [
  'All Sports',
  'Football',
  'Basketball',
  'Tennis',
  'Volleyball',
  'Cricket',
  'Rugby',
  'Golf',
  'Swimming',
  'Yoga',
  'Running',
  'Cycling',
  'Pickleball',
  'Padel',
];

const EventsScreen = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('All Sports');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [sortBy, setSortBy] = useState<'newest' | 'upcoming'>('upcoming');
  
  const navigation = useNavigation<EventsScreenNavigationProp>();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    fetchEvents();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [events, searchQuery, selectedSport, sortBy]);
  
  const fetchEvents = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const res = await getEvents();
      setEvents(res.data.events);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
  };
  
  const applyFilters = () => {
    let result = [...events];
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        event => 
          event.title.toLowerCase().includes(query) || 
          event.location.toLowerCase().includes(query) ||
          event.description?.toLowerCase().includes(query)
      );
    }
    
    // Apply sport filter
    if (selectedSport !== 'All Sports') {
      result = result.filter(
        event => event.sport_type.toLowerCase() === selectedSport.toLowerCase()
      );
    }
    
    // Apply sorting
    if (sortBy === 'newest') {
      result.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else if (sortBy === 'upcoming') {
      result.sort((a, b) => 
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
      );
    }
    
    setFilteredEvents(result);
  };
  
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedSport('All Sports');
    setSortBy('upcoming');
    setShowFilterModal(false);
  };
  
  const navigateToCreateEvent = () => {
    navigation.navigate('CreateEvent');
  };
  
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptyDescription}>
        {searchQuery || selectedSport !== 'All Sports'
          ? "Try changing your filters or create a new event."
          : "Be the first to create an event!"}
      </Text>
      <Button
        title="Create Event"
        onPress={navigateToCreateEvent}
        style={styles.createEventButton}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Events</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={navigateToCreateEvent}
        >
          <Ionicons name="add-circle-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search events"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterModal(true)}
        >
          <Ionicons name="options-outline" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      
      {selectedSport !== 'All Sports' && (
        <View style={styles.filterChip}>
          <Text style={styles.filterChipText}>{selectedSport}</Text>
          <TouchableOpacity
            onPress={() => setSelectedSport('All Sports')}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <Ionicons name="close-circle" size={16} color="#4F46E5" />
          </TouchableOpacity>
        </View>
      )}
      
      {isLoading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Retry"
            onPress={fetchEvents}
            variant="outline"
            style={styles.retryButton}
          />
        </View>
      ) : (
        <FlatList
          data={filteredEvents}
          renderItem={({ item }) => <EventCard event={item} />}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
      
      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Events</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <Text style={styles.filterSectionTitle}>Sort By</Text>
              <View style={styles.sortButtonsContainer}>
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'upcoming' && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy('upcoming')}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === 'upcoming' && styles.sortButtonTextActive
                  ]}>Upcoming</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.sortButton,
                    sortBy === 'newest' && styles.sortButtonActive
                  ]}
                  onPress={() => setSortBy('newest')}
                >
                  <Text style={[
                    styles.sortButtonText,
                    sortBy === 'newest' && styles.sortButtonTextActive
                  ]}>Newest</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.filterSectionTitle}>Sport</Text>
              <View style={styles.sportOptionsContainer}>
                {sportOptions.map((sport) => (
                  <TouchableOpacity
                    key={sport}
                    style={[
                      styles.sportOption,
                      selectedSport === sport && styles.sportOptionActive
                    ]}
                    onPress={() => setSelectedSport(sport)}
                  >
                    <Text style={[
                      styles.sportOptionText,
                      selectedSport === sport && styles.sportOptionTextActive
                    ]}>{sport}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            
            <View style={styles.modalFooter}>
              <Button
                title="Clear Filters"
                variant="outline"
                onPress={clearFilters}
                style={styles.clearFilterButton}
              />
              <Button
                title="Apply Filters"
                onPress={() => setShowFilterModal(false)}
                style={styles.applyFilterButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: '#1F2937',
  },
  clearButton: {
    padding: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginLeft: 20,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  filterChipText: {
    color: '#4F46E5',
    fontWeight: '500',
    marginRight: 8,
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
    padding: 20,
  },
  errorText: {
    color: '#B91C1C',
    marginVertical: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
  },
  listContent: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  createEventButton: {
    minWidth: 160,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  sortButtonsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  sortButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
    borderRadius: 8,
  },
  sortButtonActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  sortButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  sortButtonTextActive: {
    color: '#4F46E5',
  },
  sportOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  sportOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
  },
  sportOptionActive: {
    backgroundColor: '#EEF2FF',
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  sportOptionText: {
    color: '#6B7280',
  },
  sportOptionTextActive: {
    color: '#4F46E5',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  clearFilterButton: {
    flex: 1,
    marginRight: 12,
  },
  applyFilterButton: {
    flex: 1,
  },
});

export default EventsScreen; 