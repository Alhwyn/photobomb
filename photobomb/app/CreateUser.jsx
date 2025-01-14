import React, {useState} from 'react';
import { StyleSheet, Text, View, TouchableWithoutFeedback, Keyboard, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { theme } from '../constants/theme';
import Input from '../components/Input';
import Button from '../components/Button';
import { useRouter } from 'expo-router';
import { handleCreateUser } from '../service/userService';
import Loading from '../components/Loading';





const CreateUser = () => {
    const [username, setUsername] = useState(''); // State for username
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const handlingCreatingUser = async () => {

      setLoading(true);

      console.log('this is the username: ', username);
      const isHandleCreate = await handleCreateUser(username);

      if (!isHandleCreate?.success) {

        console.error('Error: unable to create user')

      }

      router.push('Main');

    

      setLoading(false);
    }
    
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <SafeAreaView style={styles.bigContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>
            Create User
          </Text>
        </View>
        <View style={styles.inputContainer}>
            <View style={styles.profileContainer}>
            </View>
            <Input
                placeholder='Enter your Username...'
                onChangeText={(text) => setUsername(text)}
                value={username}
            />
            <Button 
                title='Create' 
                colors={theme.buttonGradient.secondary} 
                onPress={handlingCreatingUser} // Call the function here
                value={username}

            />
        </View>
       
      </SafeAreaView>
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
