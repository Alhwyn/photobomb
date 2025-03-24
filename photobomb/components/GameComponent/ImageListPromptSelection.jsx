import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import Profile from '../Profile';
import { getSupabaseUrl } from '../../service/imageService';


const ImageListPromptSelection = ({ lobbyData, submissionData }) => {

  const filteredLobbyData = lobbyData.filter(player => !player.is_creator);

  console.log("this is the ImageListPromptselection: ", filteredLobbyData);
  console.log("this is the submissionData: ", submissionData);

  const renderItem = ({ item }) => {
    const { users } = item;
    const { username, image_url } = users;
    const getImageUri = getSupabaseUrl(image_url);

    console.log("this is the getImageUri: ", item.player_id);


    const playerSubmission = submissionData.find(
      submission => submission.player_id === item.player_id
    ); 


    const hasSubmitted = playerSubmission?.photo_uri !== null

    console.log("this is the playerSubmissio bleh: ", playerSubmission);
    console.log("this is the playerSubmission: ", hasSubmitted);

    return (
      <View style={styles.itemContainer}>
        {/* Profile Picture */}
        <Profile image_url={getImageUri} style={styles.profileImage} />
        <View>
          <Text style={styles.username}>{username} </Text>
        </View>
        <Text style={styles.checkmark}>
          {hasSubmitted ? '✅' : ''}
        </Text>
      </View>
    );
  };

  return (
    <FlatList
      data={filteredLobbyData}
      renderItem={renderItem}
      keyExtractor={(item) => item.player_id}
    />
  );
};

export default ImageListPromptSelection;

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
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  checkmark: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});