import { StyleSheet, Text,TouchableOpacity, View } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'

export const Profile = ({profileSize=48}) => {
  return (
    <TouchableOpacity style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
            <LinearGradient
                colors={['#3B82F6', '#6366F1', '#A855F7']}
                style={{
                    width: profileSize,
                    height: profileSize,
                    borderRadius: 16,
                    justifyContent: 'center',
                    }}
            >
            </LinearGradient>
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
