import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import Profile from './Profile';

const UserLobby = ({ lobbyData }) => {

  console.log(lobbyData)
  // Render each user item
  const renderItem = ({ item }) => {
    const { is_creator, users } = item; // Extract is_creator and users from item
    const { username, image_url } = users; // Extract username and image_url from users

    return (
      <View style={styles.itemContainer}>
        {/* Profile Picture */}
        <Profile image_url={image_url} style={styles.profileImage} />

        
        {/* User Information */}
        <View style={styles.infoContainer}>
          <Text style={styles.username}>{username}</Text>
          {is_creator && <Text style={styles.creatorBadge}>Creator</Text>}
        </View>
      </View>
    );
  };

  return (
    <FlatList
      data={lobbyData} // Pass the lobbyData array
      renderItem={renderItem}
      keyExtractor={(item) => item.player_id} // Use player_id as the unique key
    />
  );
};

export default UserLobby;

const styles = StyleSheet.create({
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    margin: 5,
    backgroundColor: 'rgba(39, 39, 46, 0.26)',
    borderRadius: theme.radius.xxl,
  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  profilePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#555',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  placeholderText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 10,
    justifyContent: 'center',
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  creatorBadge: {
    fontSize: 12,
    color: '#FFA500',
    marginTop: 4,
  },
});