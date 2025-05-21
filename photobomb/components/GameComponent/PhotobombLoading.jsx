import { StyleSheet, Text, View } from 'react-native'
import { theme } from '../../constants/theme'
import { Video } from 'expo-av';

const LoadingPhotobomb = ({
  message = "Prompter is picking a prompt...",
  size = "large", 
  color = 'white',
  showMessage = true
}) => {
  return (
    <View style={styles.container}>
      <Video
        style={styles.video}
        source={require('../../assets/video/loading.mov')}
        useNativeControls={false}
        resizeMode="contain"
        isLooping={true}
        shouldPlay={true}
      />
      
      {showMessage && (
        <Text style={[styles.loadingText, {color}]}>{message}</Text>
      )}
    </View>
  )
}



export default LoadingPhotobomb

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  video: {
    padding: 20,
    width: 190,
    height: 150,
    borderRadius:200,
    overflow: 'hidden',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  }
})