import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';
import Profile from './Profile';
import { getSupabaseUrl } from '../service/imageService';

const UserLobby = ({ lobbyData }) => {

  console.log(lobbyData)
  const renderItem = ({ item }) => {
    const { is_creator, users } = item;
    const { username, image_url } = users;

    const getImageUri = getSupabaseUrl(image_url);

    return (
      <View style={styles.itemContainer}>
        {/* Profile Picture */}
        <Profile image_url={getImageUri} style={styles.profileImage} />

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
      data={lobbyData} 
      renderItem={renderItem}
      keyExtractor={(item) => item.player_id} 
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