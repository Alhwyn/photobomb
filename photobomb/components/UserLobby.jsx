import React from 'react';
import { StyleSheet, Text, View, FlatList, Image } from 'react-native';
import Profile from './Profile'; // Assuming you have a Profile component for the profile picture
import { theme } from '../constants/theme';

const UserLobby = ({ users }) => {
  const renderItem = ({ item }) => {
    const { is_creator, payload } = item;
    const { username, image_url } = payload;

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
      data={users} // Array of user objects
      renderItem={renderItem}
      keyExtractor={(item, index) => index.toString()} // Unique key for each item
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
    borderRadius: theme.radius.xxl

  },
  profileImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
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