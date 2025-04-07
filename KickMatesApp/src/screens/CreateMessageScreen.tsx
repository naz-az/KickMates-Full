import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { searchUsers, createConversation } from '../services/api';

interface User {
  id: number;
  username: string;
  full_name: string;
  profile_image?: string;
  email: string;
}

interface CreateMessageScreenProps {
  route: {
    params?: {
      initialRecipient?: User;
    };
  };
}

const CreateMessageScreen: React.FC<CreateMessageScreenProps> = ({ route }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const navigation = useNavigation();
  const { user: currentUser } = useContext(AuthContext);

  useEffect(() => {
    if (route.params?.initialRecipient) {
      setSelectedUsers([route.params.initialRecipient]);
    }
  }, [route.params?.initialRecipient]);

  useEffect(() => {
    if (searchQuery.length > 1) {
      searchUsersDebounced(searchQuery);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsersDebounced = async (query: string) => {
    try {
      setLoading(true);
      const response = await searchUsers(query);
      // Filter out current user and already selected users
      const filteredUsers = response.data.users.filter(
        (user: User) => 
          user.id !== currentUser?.id && 
          !selectedUsers.some(selected => selected.id === user.id)
      );
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error searching users:', err);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery('');
    setUsers([]);
  };

  const handleUserRemove = (userId: number) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  const handleSendMessage = async () => {
    if (selectedUsers.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    if (!messageContent.trim()) {
      setError('Please enter a message');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create conversation with selected users
      const response = await createConversation({
        participantIds: selectedUsers.map(user => user.id),
        initialMessage: messageContent
      });

      // Navigate to the new conversation
      navigation.navigate('Conversation', {
        conversationId: response.data.conversationId,
        recipientId: selectedUsers[0].id,
        recipientName: selectedUsers[0].full_name,
        recipientImage: selectedUsers[0].profile_image
      });
    } catch (err) {
      console.error('Error creating conversation:', err);
      setError('Failed to create conversation');
    } finally {
      setLoading(false);
    }
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => handleUserSelect(item)}
    >
      <Image
        source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/default-avatar.png')}
        style={styles.userAvatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingContainer}
      >
        {/* Navbar */}
        <View style={styles.navbar}>
          <TouchableOpacity 
            style={styles.navbarButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.navbarTitle}>New Message</Text>
          <TouchableOpacity
            style={[styles.navbarButton, styles.sendButton]}
            onPress={handleSendMessage}
            disabled={loading || selectedUsers.length === 0}
          >
            <Text style={[
              styles.sendButtonText,
              (loading || selectedUsers.length === 0) && styles.sendButtonTextDisabled
            ]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <View style={styles.selectedUsersContainer}>
              <FlatList
                horizontal
                data={selectedUsers}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.selectedUser}>
                    <Image
                      source={item.profile_image ? { uri: item.profile_image } : require('../assets/images/default-avatar.png')}
                      style={styles.selectedUserAvatar}
                    />
                    <Text style={styles.selectedUserName} numberOfLines={1}>
                      {item.full_name}
                    </Text>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleUserRemove(item.id)}
                    >
                      <Ionicons name="close-circle" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                )}
                contentContainerStyle={styles.selectedUsersList}
              />
            </View>
          )}

          {/* Search Input */}
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#6B7280" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by username or email..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {/* Search Results */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : (
            <FlatList
              data={users}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.usersList}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Message Input */}
          <View style={styles.messageInputContainer}>
            <TextInput
              style={styles.messageInput}
              placeholder="Type your message..."
              value={messageContent}
              onChangeText={setMessageContent}
              multiline
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardAvoidingContainer: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navbarButton: {
    padding: 8,
  },
  navbarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  sendButton: {
    backgroundColor: '#4F46E5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonTextDisabled: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
  },
  selectedUsersContainer: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  selectedUsersList: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  selectedUser: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedUserAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedUserName: {
    fontSize: 14,
    color: '#111827',
    maxWidth: 100,
  },
  removeButton: {
    marginLeft: 6,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    padding: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
  },
  usersList: {
    padding: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  messageInputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  messageInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 100,
    maxHeight: 200,
  },
});

export default CreateMessageScreen; 