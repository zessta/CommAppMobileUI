import { Colors } from '@/constants/Colors';
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

  const handleLangChange = useCallback(
    (lang: string) => {
      // When a language is unchecked, return entered text to onTranslate
      if (lang === 'te') {
        if (isTeluguChecked) {
          setIsTeluguChecked(false);
          setTransLang('');
          onTranslate(enteredText); // Return enteredText when no language is selected
        } else {
          setIsTeluguChecked(true);
          setIsHindiChecked(false);
          setTransLang('te');
        }
      } else if (lang === 'hi') {
        if (isHindiChecked) {
          setIsHindiChecked(false);
          setTransLang('');
          onTranslate(enteredText); // Return enteredText when no language is selected
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
    if (!enteredText || enteredText === 'Enter a URL') return;

    setLoading(true);

    const url = 'http://40.90.233.51:8000/v1/chat/completions';

    const payload = {
      model: '/home/azureuser/finetune/viet_sing_merged_model_6/',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are given text in English. Please translate it into ${transLang === 'te' ? 'Telugu' : 'Hindi'}. 
                     Keep the translation simple. Do not return anything else. 
                     This is the text: ${enteredText}`,
            },
          ],
        },
      ],
      temperature: 0.0,
      top_p: 0.3,
      top_k: 3,
      max_tokens: 1024,
    };

    try {
      const startTime = Date.now();

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const elapsedTime = (Date.now() - startTime) / 1000;

      if (response.ok) {
        const responseData = await response.json();
        const extractedText = responseData.choices[0].message.content;
        console.log('extractedText', extractedText);
        setTranslatedText(extractedText);
        onTranslate(extractedText);
      } else {
        console.error('Error:', response.status, await response.text());
      }
    } catch (error) {
      console.error('Error parsing response:', error);
    } finally {
      setLoading(false);
    }
  }, [enteredText, transLang, onTranslate, setTranslatedText]);

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
          <TouchableOpacity style={styles.translateButton} onPress={handleTranslateButtonPress}>
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.translateText}>Translate</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Commented out Translator Component */}
        {/* {enteredText && (
          <Translator
            from="en"
            to={transLang}
            value={enteredText}
            onTranslated={(t) => setResult(t)}
          />
        )} */}
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
    width: '50%', // This ensures the checkboxes take up 50% of the container width
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
    width: '50%', // This ensures the translate button takes up the remaining 50% of the container width
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
  translateText: {
    color: '#FFF',
    fontWeight: '600',
  },
});
