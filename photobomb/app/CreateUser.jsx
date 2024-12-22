import React, {useState} from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, Keyboard, Alert } from 'react-native';
import { theme } from '../constants/theme';
import BackButton from '../components/BackButton';
import Input from '../components/Input';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import Profile from '../components/Profile';
import { handleCreateUser } from '../service/userService';


const CreateUser = () => {
    const [username, setUsername] = useState(''); // State for username
    const router = useRouter();

    const onCreateUserPress = async () => {
        console.log('username: ', username);
        if (!username.trim()) {
          Alert.alert('Error', 'Please enter a username');
          return;
        }
    
        const response = await handleCreateUser({ username });
    
        if (response.success) {
          Alert.alert('Success', 'User created successfully!');
          router.push('Main'); // Navigate to the lobby on success
        } else {
          Alert.alert('Error', response.msg || 'Failed to create user');
        }
    };
    


  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.bigContainer}>
        <BackButton/>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            Create User
          </Text>
        </View>
        <View style={styles.inputContainer}>
            <View style={styles.profileContainer}>
                <Profile
                    profileSize={64}
                />
            </View>
            <Input
                placeholder='Enter your Username...'
                onChangeText={(text) => setUsername(text)}
                value={username}
            />
            <Button 
                title='Create' 
                colors={theme.buttonGradient.secondary} 
                onPress={onCreateUserPress} // Call the function here
                value={username}

            />
        </View>
       
      </View>
    </TouchableWithoutFeedback>
  );
};

export default CreateUser;

const styles = StyleSheet.create({
  bigContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  title: {
    color: '#ffffff', 
    fontWeight: theme.fonts.extraBold,
    fontSize: 32,
  },
  headerContainer: {
    alignItems: 'center',
    paddingTop: 10,
  }, 
  inputContainer: {
    flex: 1,
    justifyContent: 'center',
    gap: 20,
    paddingLeft: 20,
    paddingRight: 20,
    marginBottom: 250, 
  },
  profileContainer: {
    alignItems: 'center',
  }
  

});
