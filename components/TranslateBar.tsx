import { Colors } from '@/constants/Colors';
import { getTranslationText } from '@/services/api/auth';
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
  const [isTeluguChecked, setIsTeluguChecked] = useState<boolean>(false);
  const [isHindiChecked, setIsHindiChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const languageList = useMemo(
    () => [
      { value: 'te', title: 'Telugu' },
      { value: 'hi', title: 'Hindi' },
    ],
    [],
  );

  const isTranslateDisabled = useMemo(
    () => !isTeluguChecked && !isHindiChecked,
    [isTeluguChecked, isHindiChecked],
  );

  const handleLangChange = useCallback(
    (lang: string) => {
      if (lang === 'te') {
        if (isTeluguChecked) {
          setIsTeluguChecked(false);
          setTransLang('');
          onTranslate(enteredText);
        } else {
          setIsTeluguChecked(true);
          setIsHindiChecked(false);
          setTransLang('te');
        }
      } else if (lang === 'hi') {
        if (isHindiChecked) {
          setIsHindiChecked(false);
          setTransLang('');
          onTranslate(enteredText);
        } else {
          setIsHindiChecked(true);
          setIsTeluguChecked(false);
          setTransLang('hi');
        }
      }
    },
    [isTeluguChecked, isHindiChecked, enteredText, onTranslate],
  );

  useEffect(() => {
    if (enteredText && enteredText !== 'Enter a URL') {
      setResult('');
    }
  }, [enteredText, transLang]);

  const handleTranslateButtonPress = useCallback(async () => {
    if (!enteredText || isTranslateDisabled) return;

    setLoading(true);

    try {
      const translationResponse = await getTranslationText(enteredText, transLang);
      console.log('translationResponse', translationResponse);
      if (translationResponse) {
        setTranslatedText(translationResponse);
        onTranslate(translationResponse);
      } else {
        console.error('Translation failed');
      }
    } catch (error) {
      console.error('Error during translation:', error);
    } finally {
      setLoading(false);
    }
  }, [enteredText, transLang, onTranslate, setTranslatedText, isTranslateDisabled]);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={styles.translateContainer}>
        {/* Language Checkboxes Section */}
        <View style={styles.languageContainer}>
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
        </View>

        {/* Translate Button Section */}
        <View style={styles.translateButtonContainer}>
          <TouchableOpacity
            style={[
              styles.translateButton,
              isTranslateDisabled && styles.translateButtonDisabled, // Apply disabled style if no checkbox is checked
            ]}
            onPress={handleTranslateButtonPress}
            disabled={isTranslateDisabled} // Disable the button if no checkbox is checked
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.translateText}>Translate</Text>
            )}
          </TouchableOpacity>
        </View>
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
    justifyContent: 'flex-start',
    width: '100%',
  },
  languageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '50%',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    maxWidth: '50%',
    gap: 10,
  },
  checkbox: {
    marginRight: 5,
    borderRadius: 5,
  },
  checkboxText: {
    fontSize: 16,
    color: Colors.blueColor,
    fontWeight: '600',
  },
  translateButtonContainer: {
    width: '50%',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  translateButton: {
    backgroundColor: Colors.blueColor,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6.3,
    alignSelf: 'flex-end',
  },
  translateButtonDisabled: {
    backgroundColor: '#B0B0B0', // Grey color when disabled
  },
  translateText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
