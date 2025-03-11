import { useUser } from '@/components/UserContext';
import { CHAT_TEST_DATA, USER_CONTEXT } from '@/constants/Strings';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { OtpInput } from 'react-native-otp-entry';
const LoginScreen = () => {
  const router = useRouter();
  const [input, setInput] = useState<string>('');
  const [showOTP, setShowOTP] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [filledOTP, setFilledOTP] = useState<number>(111111);
  const { setUser } = useUser(); // Get the setter function from context

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setShowOTP(true);
    }, 2000);
  };

  const onClickedVerifyOTP = () => {
    setLoading(true);
    const findLoginData = CHAT_TEST_DATA.find((data) => data.name === input);
    setTimeout(() => {
      setLoading(false);
      setUser(findLoginData || USER_CONTEXT);
      router.push({ pathname: '/(tabs)/chatListScreen', params: { userInputName: input } });
    }, 2000);
  };
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {!showOTP ? (
          <View style={styles.form}>
            <Text style={styles.title}>Enter Email or Mobile Number</Text>
            <TextInput
              style={styles.input}
              placeholder="Email or Mobile"
              placeholderTextColor="#000"
              value={input}
              onChangeText={setInput}
            />
            <TouchableOpacity onPress={handleLogin} style={styles.button}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Next</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Enter OTP</Text>
            <OtpInput
              numberOfDigits={6}
              onTextChange={(otp) => setFilledOTP(Number(otp))}
              type="numeric"
              onFilled={(otp) => setFilledOTP(Number(otp))}
            />
            <View style={styles.otpButtonsContainer}>
              <TouchableOpacity onPress={() => setShowOTP(false)} style={styles.button}>
                <Text style={styles.buttonText}>Go Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={filledOTP ? filledOTP.toString().length < 6 : true}
                onPress={onClickedVerifyOTP}
                style={[
                  styles.button,
                  {
                    backgroundColor:
                      filledOTP && filledOTP.toString().length === 6 ? '#007AFF' : 'grey',
                  },
                ]}>
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify OTP</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    height: '100%',
    width: '100%',
  },
  card: {
    borderRadius: 10,
    width: '80%',
  },
  form: {
    padding: 20,
  },
  title: {
    color: '#000',
    fontSize: 18,
    marginBottom: 10,
    padding: 10,
    fontWeight: '900',
  },
  input: {
    borderWidth: 1,
    borderColor: '#444',
    color: '#000',
    width: '100%',
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  otpButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 30,
  },
});

export default LoginScreen;
