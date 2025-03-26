import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useUser } from './UserContext';

interface RenderMessageProps {
  messageProps: any;
  handleStatusClick: (currentUserMessage: any) => void;
}

const RenderMessage: React.FC<RenderMessageProps> = ({ messageProps, handleStatusClick }) => {
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
        {!isCurrentUser && <MessageAvatar uri={currentMessage.user.avatar} />}
        <MessageContent
          isCurrentUser={isCurrentUser}
          messageText={messageText}
          tagName={tagName}
          handleStatusClick={handleStatusClick}
          currentMessage={currentMessage}
        />
        {isCurrentUser && <MessageAvatar uri={currentMessage.user.avatar} />}
      </View>
    </Animated.View>
  );
};

const MessageAvatar = ({ uri }: { uri: string }) => (
  <Image source={{ uri }} style={styles.messageAvatar} />
);

const MessageContent = ({
  isCurrentUser,
  messageText,
  tagName,
  handleStatusClick,
  currentMessage,
}: {
  isCurrentUser: boolean;
  messageText: string;
  tagName: string | null;
  handleStatusClick: (currentUserMessage: any) => void;
  currentMessage: any;
}) => (
  <View style={styles.messageContent}>
    <View style={[styles.bubble, isCurrentUser ? styles.bubbleRight : styles.bubbleLeft]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }}>
        {/* If the current user, show the green dot at flex-start */}
        {isCurrentUser ? (
          <>
            {tagName ? (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'green',
                  marginRight: 8,
                }}
              />
            ) : null}
            <Text
              style={{
                fontWeight: '900',
                fontFamily: 'Poppins',
                fontSize: 14,
                color: '#234B89',
              }}>
              {currentMessage.user.name}
            </Text>
          </>
        ) : (
          // If it's not the current user, show the green dot at flex-end
          <>
            <Text
              style={{
                fontWeight: '900',
                fontFamily: 'Poppins',
                fontSize: 14,
                color: '#234B89',
              }}>
              {currentMessage.user.name}
            </Text>
            {tagName ? (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: 'green',
                  marginLeft: 8,
                }}
              />
            ) : null}
          </>
        )}
      </View>
      <Text style={[styles.bubbleText, { color: isCurrentUser ? '#1f1f1f' : '#333' }]}>
        {messageText}
      </Text>
      {/* {tagName && (
        <StatusTag
          tagName={tagName}
          currentMessage={currentMessage}
          handleStatusClick={handleStatusClick}
        />
      )} */}
    </View>
    <View
      style={{
        flexDirection: 'row',
        justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
        gap: 5,
      }}>
      {tagName ? (
        <TouchableOpacity onPress={() => handleStatusClick(currentMessage)}>
          <Text style={{ fontSize: 14, fontWeight: '900', color: '#234B89', marginTop: 2 }}>
            #{tagName}
          </Text>
        </TouchableOpacity>
      ) : null}
      <Text style={[styles.timestamp, { alignSelf: isCurrentUser ? 'flex-end' : 'flex-start' }]}>
        {currentMessage.createdAt?.toLocaleTimeString?.([], {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  </View>
);

const StatusTag = ({
  tagName,
  currentMessage,
  handleStatusClick,
}: {
  tagName: string;
  currentMessage: any;
  handleStatusClick: (currentUserMessage: any) => void;
}) => (
  <TouchableOpacity style={styles.statusButton} onPress={() => handleStatusClick(currentMessage)}>
    <Text style={styles.statusText}>{`#${tagName}`}</Text>
  </TouchableOpacity>
);

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
    backgroundColor: 'lightgrey',
    borderBottomLeftRadius: 0,
    alignSelf: 'flex-start',
  },
  bubbleRight: {
    backgroundColor: '#F5F7FB',
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
  statusButton: {
    backgroundColor: '#E3F2FD', // Soft blue background
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20, // More rounded corners
    marginRight: 8,
    marginBottom: 5,
    borderWidth: 1,
    borderColor: '#0277BD', // Slight border to define the tag
    elevation: 3, // Add some depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  statusText: {
    fontSize: 14, // Increased size for visibility
    color: '#0277BD', // Contrast with soft background
    fontWeight: '600', // Slightly bolder font for emphasis
    textTransform: 'capitalize', // Capitalize the first letter of the tag
  },
  timestamp: {
    fontSize: 12,
    color: '#A08E67',
    marginTop: 2,
  },
});
