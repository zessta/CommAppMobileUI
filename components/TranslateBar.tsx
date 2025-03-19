import Checkbox from 'expo-checkbox';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import Translator from 'react-native-translator';

const TranslateBar = ({
  onTranslate,
  enteredText,
  setTranslatedText,
}: {
  onTranslate: (result: string) => void;
  enteredText: string;
  setTranslatedText: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [result, setResult] = useState<string>('');
  const [transLang, setTransLang] = useState<string>('te');
  const [isTeluguChecked, setIsTeluguChecked] = useState<boolean>(true);
  const [isHindiChecked, setIsHindiChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const languageList = useMemo(
    () => [
      { value: 'te', title: 'Telugu' },
      { value: 'hi', title: 'Hindi' },
    ],
    [],
  );

  const handleLangChange = useCallback((lang: string) => {
    if (lang === 'te') {
      setIsTeluguChecked(true);
      setIsHindiChecked(false);
      setTransLang('te');
    } else if (lang === 'hi') {
      setIsTeluguChecked(false);
      setIsHindiChecked(true);
      setTransLang('hi');
    }
  }, []);

  useEffect(() => {
    if (enteredText && enteredText !== 'Enter a URL') {
      setResult('');
    }
  }, [enteredText, transLang]);

  const handleTranslateButtonPress = useCallback(() => {
    if (!enteredText || result === 'Enter a URL') return;
    setLoading(true);
    setTimeout(() => {
      setTranslatedText(result);
      onTranslate(result);
      setLoading(false);
    }, 1000);
  }, [enteredText, result, onTranslate, setTranslatedText]);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={styles.translateContainer}>
        {languageList.map((lang) => (
          <View style={styles.checkboxRow} key={lang.value}>
            <Checkbox
              value={lang.value === 'te' ? isTeluguChecked : isHindiChecked}
              onValueChange={() => handleLangChange(lang.value)}
              style={styles.checkbox}
              color={isTeluguChecked || isHindiChecked ? '#234B89' : undefined}
            />
            <Text style={styles.checkboxText}>{lang.title}</Text>
          </View>
        ))}
        <TouchableOpacity style={styles.translateButton} onPress={handleTranslateButtonPress}>
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.translateText}>Translate</Text>
          )}
        </TouchableOpacity>
        {enteredText && (
          <Translator
            from="en"
            to={transLang}
            value={enteredText}
            onTranslated={(t) => setResult(t)}
          />
        )}
      </View>
    </Animated.View>
  );
};

export default TranslateBar;

const styles = StyleSheet.create({
  translateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  checkbox: {
    marginRight: 5,
  },
  checkboxText: {
    fontSize: 16,
    color: '#333',
  },
  translateButton: {
    backgroundColor: '#A08E67',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  translateText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
