import { StyleSheet, Text,TouchableOpacity, View } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'

const Profile = () => {
  return (
    <TouchableOpacity style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
            <LinearGradient
            colors={['#3B82F6', '#6366F1', '#A855F7']}
            style={styles.avatar}
            >
            <Text style={styles.avatarText}>A</Text>
            </LinearGradient>
            <View style={styles.onlineIndicator} />
        </View>
        <View>
            <Text style={styles.username}>Alhwyn</Text>
        </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
    profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    },
    avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    },
    onlineIndicator: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#000',
    },
    username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    },
})

export default Profile
