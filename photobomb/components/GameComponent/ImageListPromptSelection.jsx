import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { theme } from '../../constants/theme';
import Profile from '../Profile';
import { getSupabaseUrl } from '../../service/imageService';


const ImageListPromptSelection = ({ lobbyData, submissionData }) => {

  const renderItem = ({ item }) => {
    const { users } = item;
    const { username, image_url } = users;
    const getImageUri = getSupabaseUrl(image_url);

    // Convert item?.id to string for safe comparison
    const playerId = item?.id ? String(item.id) : null;
    
    // Find the submission entry for this player
    const playerSubmission = submissionData.find(submission => 
      String(submission.player_id) === playerId
    );
    
    // Debug output to see what's going on with more details
    console.log(`Player ${username} (ID: ${playerId}):`, 
      playerSubmission ? 
        `Submission found, photo_uri = ${playerSubmission.photo_uri}, submission ID: ${playerSubmission.id}` : 
        'No submission found'
    );
    
    // A player has submitted if they have a submission with a non-null photo_uri
    const hasSubmitted = playerSubmission && 
                       playerSubmission.photo_uri !== null && 
                       playerSubmission.photo_uri !== undefined && 
                       playerSubmission.photo_uri !== '';

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
      data={lobbyData}
      renderItem={renderItem}
      keyExtractor={(item, index) => `player-submission-${index}`}
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
    paddingLeft: 8,
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