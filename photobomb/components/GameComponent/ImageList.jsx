import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import Profile from '../Profile';
import { getSupabaseUrl } from '../../service/imageService';

const ImageList = ({ lobbyData }) => {

  console.log(lobbyData)
  const renderItem = ({ item }) => {
    const { users } = item;
    const { username, image_url } = users;

    const getImageUri = getSupabaseUrl(image_url);

    return (
      <View style={styles.itemContainer}>
        {/* Profile Picture */}
        <Profile image_url={getImageUri} style={styles.profileImage} />

        {/* User Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.username}>{username}</Text>
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={lobbyData} 
      renderItem={renderItem}
      keyExtractor={(item) => item.player_id} 
    />
  );
};

export default ImageList;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 8,
    backgroundColor: 'rgba(39, 39, 46, 0.26)',
    borderRadius: theme.radius.xxl,
    paddingRight: 120,
  },
  // Profile elements
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.round,
    marginRight: 12,
  },
  profilePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.round,
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  // Text elements
  placeholderText: {
    color: '#fff',
    fontWeight: '600',
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  }
});