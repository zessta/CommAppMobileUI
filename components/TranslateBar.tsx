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
  const [isLoadingTranslate, setIsLoadingTranslate] = useState<boolean>(false);
  const [isLoadingDraft, setIsLoadingDraft] = useState<boolean>(false);

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

  const handleTranslateButtonPress = useCallback(
    async (isDrafting?: boolean) => {
      if (!enteredText) return;
      if (isDrafting) {
        setIsLoadingDraft(true);
      } else {
        setIsLoadingTranslate(true);
      }

      try {
        const translationResponse = await getTranslationText(enteredText, transLang, isDrafting);
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
        if (isDrafting) {
          setIsLoadingDraft(false);
        } else {
          setIsLoadingTranslate(false);
        }
      }
    },
    [enteredText, transLang, onTranslate, setTranslatedText, isTranslateDisabled],
  );

  const handleDraftButtonPress = useCallback(() => {
    if (!enteredText) return;

    setIsLoadingDraft(true);

    handleTranslateButtonPress(true).finally(() => {
      setIsLoadingDraft(false);
    });
  }, [enteredText, handleTranslateButtonPress]);

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View style={styles.translateContainer}>
        {/* Language Selection and Drafting Option in Row */}
        <View style={styles.languageAndDraftContainer}>
          <View style={styles.rowContainer}>
            <View style={styles.checkboxContainer}>
              {languageList.map((lang) => (
                <View style={styles.checkboxRow} key={lang.value}>
                  <Checkbox
                    value={lang.value === 'te' ? isTeluguChecked : isHindiChecked}
                    onValueChange={() => handleLangChange(lang.value)}
                    style={styles.checkbox}
                    color={isTeluguChecked || isHindiChecked ? Colors.blueColor : undefined}
                  />
                  <Text style={styles.checkboxText}>{lang.title}</Text>
                </View>
              ))}
            </View>

            {/* Translate Button */}
            <View style={styles.draftingButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.translateButton,
                  isTranslateDisabled && styles.translateButtonDisabled,
                ]}
                onPress={() => handleTranslateButtonPress()}
                disabled={isTranslateDisabled}>
                {isLoadingTranslate ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.translateText}>Translate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Drafting Button */}
          <View style={styles.translateButtonContainer}>
            <TouchableOpacity
              style={[
                styles.translateButton,
                (!enteredText || !isTranslateDisabled) && styles.translateButtonDisabled,
              ]}
              onPress={() => handleTranslateButtonPress(true)}
              disabled={!enteredText || !isTranslateDisabled}>
              {isLoadingDraft ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.translateText}>Draft the message</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Display the translated text */}
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
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: '100%',
  },
  languageAndDraftContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    width: '100%',
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 15,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 5,
    borderRadius: 5,
  },
  checkboxText: {
    fontSize: 16,
    color: Colors.blueColor,
    fontWeight: '500',
  },
  draftingButtonContainer: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
  },
  translateButtonContainer: {
    width: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  translateButton: {
    backgroundColor: Colors.blueColor,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 6.3,
    alignSelf: 'flex-start',
  },
  translateButtonDisabled: {
    backgroundColor: '#B0B0B0',
  },
  translateText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
