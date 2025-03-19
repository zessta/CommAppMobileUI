import { SelectedStatusTagProps } from '@/app/GroupStack/GroupChatScreen';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useUser } from './UserContext';
const RenderMessage = ({
  messageProps,
  handleStatusClick,
}: {
  messageProps: any;
  handleStatusClick: (status: SelectedStatusTagProps) => void;
}) => {
  const { user } = useUser();

  const { currentMessage } = messageProps;
  const isCurrentUser = currentMessage.user._id === user?.userId;

  const [messageText, tagName] = currentMessage.text.includes('\n')
    ? currentMessage.text.split('\n')
    : [currentMessage.text, null];

  return (
    <Animated.View entering={FadeIn} exiting={FadeOut}>
      <View
        style={[
          styles.messageContainer,
          isCurrentUser ? styles.messageContainerRight : styles.messageContainerLeft,
        ]}>
        {!isCurrentUser && (
          <Image source={{ uri: currentMessage.user.avatar }} style={styles.messageAvatar} />
        )}
        <View style={styles.messageContent}>
          <View style={[styles.bubble, isCurrentUser ? styles.bubbleRight : styles.bubbleLeft]}>
            <Text style={[styles.bubbleText, { color: isCurrentUser ? '#FFF' : '#333' }]}>
              {messageText}
            </Text>
            {tagName && (
              <Text
                style={[
                  styles.bubbleText,
                  { color: isCurrentUser ? '#D1C4E9' : '#0288D1', marginTop: 5 },
                ]}>
                {tagName}
              </Text>
            )}
            {currentMessage.customData?.statuses?.length > 0 && (
              <View style={styles.statusContainer}>
                {currentMessage.customData.statuses.map((status: SelectedStatusTagProps) => (
                  <TouchableOpacity
                    disabled={isCurrentUser}
                    key={status.eventTagStatusId}
                    style={styles.statusButton}
                    onPress={() => handleStatusClick(status)}>
                    <Text style={styles.statusText}>{status.statusName}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          <Text style={styles.timestamp}>
            {currentMessage.createdAt.toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
        {isCurrentUser && (
          <Image source={{ uri: currentMessage.user.avatar }} style={styles.messageAvatar} />
        )}
      </View>
    </Animated.View>
  );
};
export default RenderMessage;
const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 5,
  },
  messageContainerLeft: {
    justifyContent: 'flex-start',
    marginRight: 50,
  },
  messageContainerRight: {
    justifyContent: 'flex-end',
    marginLeft: 50,
  },
  messageContent: {
    flex: 1,
  },
  bubble: {
    borderRadius: 15,
    padding: 10,
    maxWidth: '100%',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  bubbleLeft: {
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 0,
  },
  bubbleRight: {
    backgroundColor: '#A08E67',
    borderBottomRightRadius: 0,
    alignSelf: 'flex-end',
  },
  bubbleText: {
    fontSize: 16,
  },
  messageAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: 5,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  statusButton: {
    backgroundColor: '#E0F7FA',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 5,
  },
  statusText: {
    fontSize: 12,
    color: '#0277BD',
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#A08E67',
    marginTop: 2,
    alignSelf: 'flex-end',
  },
});
