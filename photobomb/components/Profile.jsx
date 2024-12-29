import { Image, StyleSheet, View } from 'react-native'
import React from 'react'
import { LinearGradient } from 'expo-linear-gradient'

export const Profile = ({profileSize=48, image_url=null}) => {
  return (
    <View style={styles.profileContainer}>
        <View style={styles.avatarContainer}>
            {image_url ? (
                <Image
                    source={{ uri: image_url}}
                    style={{
                        width: profileSize,
                        height: profileSize,
                        borderRadius: 10,
                        
                        }}
                />
            ) : (

            <LinearGradient
            colors={['#3B82F6', '#6366F1', '#A855F7']}
            style={{
                width: profileSize,
                height: profileSize,
                justifyContent: 'center',
                borderRadius: 10,
                }}
            >
            </LinearGradient>
            )}
            
        </View>
    </View>
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
    backgroundColor: '#22C55E',
    borderWidth: 2,
    borderColor: '#000',
    },
    username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    },
    cameraFilm: {
        backgroundColor: '#fffdf2',
        paddingBottom: 10,
        padding: 2,
    }
})

export default Profile
