import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import { Bubble, GiftedChat, IMessage } from 'react-native-gifted-chat';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { v4 as uuidv4 } from 'uuid';
import { useUser } from '@/components/UserContext';
import { useSignalR } from '@/services/signalRService';
import { getGroupChatHistory, getGroupUsers } from '@/services/api/auth';
import { SOCKET_URL } from '@/constants/Strings';
import { ChatMessageServer, Group, Participants } from '@/constants/Types';
import SendTag from './SendTag';
import { IconSymbol } from '@/components/ui/IconSymbol';
import Translator from 'react-native-translator';
import AddMembersToGroup from './AddMemberToGroup';
import Checkbox from 'expo-checkbox';

export interface ICustomMessage extends IMessage {
  pollOptions?: {
    id: number;
    option: string;
    votes: number;
  }[] | null | undefined;
}

export interface ITag {
  description: string;
  eventTagId: number;
  name: string;
  statuses: {
    eventTagStatusId: number;
    statusName: string;
  }[];
}

// Custom Components
const HeaderLeft = ({ onBack, groupName }: { onBack: () => void; groupName: string }) => (
  <View style={styles.headerLeft}>
    <TouchableOpacity onPress={onBack} style={styles.headerButton}>
      <IconSymbol size={28} name="arrow-back" color={'#fff'} />
    </TouchableOpacity>
    <Image
      source={{
        uri: `https://ui-avatars.com/api/?background=000000&color=FFF&name=${groupName || 'Default'}`,
      }}
      style={styles.avatar}
    />
  </View>
);

const HeaderRight = ({ onAddMember, handleSendTag }: { onAddMember: () => void, handleSendTag: () => void }) => (
  <View style={styles.headerRight}>
    <TouchableOpacity onPress={handleSendTag} style={styles.headerIcon}>
      <IconSymbol size={28} name="poll" color={'#fff'} />
    </TouchableOpacity>
    <TouchableOpacity onPress={onAddMember} style={styles.headerIcon}>
      <IconSymbol size={28} name="adduser" color={'#fff'} />
    </TouchableOpacity>
  </View>
);

const HeaderTitle = ({ title, onPress }: { title: string; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} style={styles.headerTitleContainer}>
    <Text style={styles.headerTitle}>{title}</Text>
  </TouchableOpacity>
);

const Placeholder = () => (
  <View style={styles.placeholderContainer}>
    <Text style={styles.placeholderText}>Send a message to start the conversation</Text>
  </View>
);

const TranslateBar = ({
  onTranslate,
  enteredText,
  setTranslatedText,
}: {
  onTranslate: (result: string) => void;
  enteredText: string;
  setTranslatedText: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const [result, setResult] = useState<string>(''); // Translated result
  const [transLang, setTransLang] = useState<string>('te'); // Default: Telugu
  const [isTeluguChecked, setIsTeluguChecked] = useState(true);
  const [isHindiChecked, setIsHindiChecked] = useState(false);
  const [loading, setLoading] = useState(false);

  const languageList = useMemo(
    () => [
      { value: 'te', title: 'Telugu' },
      { value: 'hi', title: 'Hindi' },
    ],
    [],
  );

  // Handle language change
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

  // Trigger translation when enteredText or transLang changes
  useEffect(() => {
    if (enteredText && enteredText !== 'Enter a URL') {
      setResult(''); // Reset result to trigger new translation
    }
  }, [enteredText, transLang]);

  // Handle translation button press
  const handleTranslateButtonPress = useCallback(() => {
    if (!enteredText || result === 'Enter a URL') return;
    setLoading(true);
    setTimeout(() => {
      setTranslatedText(result); // Update parent state
      onTranslate(result); // Notify parent
      setLoading(false);
    }, 1000); // Reduced delay for better UX
  }, [enteredText, result, onTranslate, setTranslatedText]);

  return (
    <View style={styles.translateContainer}>
      {languageList.map((lang) => (
        <View style={styles.checkboxRow} key={lang.value}>
          <Checkbox
            value={lang.value === 'te' ? isTeluguChecked : isHindiChecked}
            onValueChange={() => handleLangChange(lang.value)}
            style={styles.checkbox}
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
  );
};

const AcceptButton = ({ onAccept }: { onAccept: () => void }) => (
  <TouchableOpacity style={styles.acceptButton} onPress={onAccept}>
    <Text style={styles.acceptText}>Accept</Text>
  </TouchableOpacity>
);

// Main Component
const GroupChatScreen: React.FC = () => {
  const { selectedGroup: selectedGroupString } = useLocalSearchParams<{ selectedGroup: string }>();
  const selectedGroup: Group = useMemo(
    () => (selectedGroupString ? JSON.parse(selectedGroupString) : null),
    [selectedGroupString],
  );
  const { user } = useUser();
  const connection = useSignalR(SOCKET_URL);

  const [messages, setMessages] = useState<ICustomMessage[]>([]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [isTagDialogVisible, setIsTagDialogVisible] = useState<boolean>(false);
  const [groupUsers, setGroupUsers] = useState<Participants[]>([]);
  const [enteredText, setEnteredText] = useState('');
  const [translatedText, setTranslatedText] = useState('');

  const groupUsersMemo = useMemo(() => groupUsers, [groupUsers]);

  // Fetch group chat history and users
  const fetchGroupData = useCallback(async () => {
    if (!selectedGroup?.groupId) return;
    try {
      const [users, history] = await Promise.all([
        getGroupUsers(selectedGroup.groupId),
        getGroupChatHistory(selectedGroup.groupId),
      ]);
      setGroupUsers(users);
      const formattedMessages = history.map((chat: ChatMessageServer) => ({
        _id: uuidv4(),
        text: chat.messageText,
        createdAt: new Date(chat.createdOn).getTime(),
        user: {
          _id: chat.senderId,
          name: users.find((u) => u.userId === chat.senderId)?.userName || 'Unknown',
        },
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error fetching group data:', error);
    }
  }, []);

  // Setup SignalR listeners
  useEffect(() => {
    if (!connection) return;

    const handleReceiveMessage = (
      senderId: number,
      message: string,
      groupName: string,
      groupId: number,
    ) => {
      setMessages((prev) =>
        GiftedChat.append(prev, [
          {
            _id: groupId || uuidv4(),
            text: message,
            createdAt: new Date().getTime(),
            user: {
              _id: senderId,
              name: groupUsers.find((u) => u.userId === senderId)?.userName || 'Unknown',
            },
          },
        ]),
      );
    };

    const handleMemberAdded = (groupId: number, newMember: string) => {
      console.log('GroupMemberAdded:', groupId, newMember);
    };

    connection.on('ReceiveGroupMessage', handleReceiveMessage);
    connection.on('GroupMemberAdded', handleMemberAdded);
    fetchGroupData();

    return () => {
      connection.off('ReceiveGroupMessage', handleReceiveMessage);
      connection.off('GroupMemberAdded', handleMemberAdded);
    };
  }, [connection, fetchGroupData]);

  //send tag message
  const onSendTagMessage = (tag?: ITag, message?: string) => {
    if(!tag) {
      alert('Please select a Tag');
      return;
    }
    if(!message || message?.trim() === '') {
      alert('Please enter a message');
      return;
    }
    //setting options for selecting poll
    const pollOptions = tag.statuses.map((status) => {
      const poll = {
        id: status.eventTagStatusId,
        option: status.statusName,
        votes: 0,
      }
      return poll;
    })
    const tagMessage: ICustomMessage = {
      _id: uuidv4(),
      text: message,
      createdAt: new Date().getTime(), 
      pollOptions: pollOptions,
      user: {
        _id: 105,
        // name: groupUsers.find((user) => user.userId === 105)?.userName,
      },
    }
    setMessages((prevMessages) => GiftedChat.append(prevMessages, [tagMessage]));
    setIsTagDialogVisible(false);
  }


  // Send message via SignalR
  const onSend = useCallback(
    async (newMessages: ICustomMessage[] = []) => {
      if (!newMessages.length || !connection || connection.state !== 'Connected') return;
      const message = newMessages[0];
      try {
        await connection.invoke('SendMessageToGroup', selectedGroup.groupId, message.text);
        setEnteredText(''); // Clear input after sending
        fetchGroupData();
      } catch (error) {
        console.error('Error sending message:', error);
      }
    },
    [connection, selectedGroup?.groupId],
  );

  // Handle translation
  const handleTranslate = useCallback((trans: string) => {
    if (!trans || trans === 'Enter a URL') return;
    setTranslatedText(trans);
  }, []);

  // Accept translated text
  const handleAcceptTranslation = useCallback(() => {
    setEnteredText(translatedText);
    setTranslatedText('');
  }, [translatedText]);

  // Navigate to group details
  const navigateToGroupDetails = useCallback(() => {
    router.push({
      pathname: '/GroupStack/GroupDetailsScreen',
      params: {
        group: JSON.stringify(selectedGroup),
        groupUsers: JSON.stringify(groupUsers),
      },
    });
  }, [selectedGroup, groupUsers]);

  const handleVote = (messageId: number, optionId: number) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) => {
        if (msg._id === messageId && msg.pollOptions) {
          return {
            ...msg,
            pollOptions: msg.pollOptions.map((opt) =>
              opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
            ),
          };
        }
        return msg;
      })
    );
  };

  // Custom render for poll messages
  const renderCustomMessage = (props) => {
    const { currentMessage } = props;
    if (currentMessage.pollOptions) {
      return (
        <View style={styles.pollContainer}>
          <Text style={styles.pollQuestion}>{currentMessage.text}</Text>
          {currentMessage.pollOptions.map((option : any) => (
            <TouchableOpacity
              key={option.id}
              style={styles.pollOption}
              onPress={() => handleVote(currentMessage._id, option.id)}
            >
              <Text style={styles.optionText}>
                {option.option} - ({option.votes})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      );
    }
    return <Bubble {...props} />;
  };


  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerStyle: { backgroundColor: '#1E88E5' },
          headerLeft: () => (
            <HeaderLeft onBack={() => router.back()} groupName={selectedGroup?.groupName} />
          ),
          headerTitle: () => (
            <HeaderTitle
              title={selectedGroup?.groupName || 'Group Chat'}
              onPress={navigateToGroupDetails}
            />
          ),
          headerRight: () => <HeaderRight onAddMember={() => setIsDialogVisible(true)} handleSendTag={() => setIsTagDialogVisible(true)} />,
        }}
      />
      {isDialogVisible ? (
        <AddMembersToGroup
          setIsDialogVisible={setIsDialogVisible}
          selectedGroup={selectedGroup}
          groupUserList={groupUsers}
        />
      ) : isTagDialogVisible ? (
        <SendTag
          onSendTagMessage={onSendTagMessage}
          setIsTagDialogVisible={setIsTagDialogVisible}
        />
      ) : (
        <View style={styles.chatContainer}>
          <GiftedChat
            messages={messages}
            onSend={onSend}
            user={{
              _id: Number(user?.id),
              name: user?.name,
              avatar: `https://ui-avatars.com/api/?background=1E88E5&color=FFF&name=${user?.name || 'User'}`,
            }}
            renderFooter={() => (messages.length === 0 ? <Placeholder /> : null)}
            onInputTextChanged={setEnteredText}
            text={enteredText}
            placeholder="Type a message..."
            // inverted
            renderMessage={renderCustomMessage}
            renderBubble={(props) => (
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor:
                      props.currentMessage.user._id === user?.id ? '#1E88E5' : '#E0E0E0',
                  },
                ]}>
                <Text
                  style={[
                    styles.bubbleText,
                    {
                      color: props.currentMessage.user._id === user?.id ? '#FFF' : '#333',
                    },
                  ]}>
                  {props.currentMessage.text}
                </Text>
              </View>
            )}
          />
          <TranslateBar
            onTranslate={handleTranslate}
            enteredText={enteredText}
            setTranslatedText={setTranslatedText}
          />
          {translatedText && <Text style={styles.translatedText}>{translatedText}</Text>}
          {translatedText && <AcceptButton onAccept={handleAcceptTranslation} />}
        </View>
      )}
    </View>
  );
};

// Styles (unchanged)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  chatContainer: { flex: 1 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  headerButton: { padding: 5 },
  headerIcon: { padding: 5, marginLeft: 10 },
  headerTitleContainer: { paddingVertical: 10 },
  headerTitle: { fontSize: 20, fontWeight: '600', color: '#FFF' },
  placeholderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  placeholderText: { fontSize: 16, color: '#757575', fontStyle: 'italic' },
  translateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderColor: '#E0E0E0',
  },
  translateButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  translateText: { color: '#FFF', fontWeight: '600' },
  translatedText: { marginLeft: 10, fontSize: 14, color: '#424242' },
  acceptButton: {
    backgroundColor: '#43A047',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    margin: 10,
  },
  pollContainer: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  pollQuestion: {
    fontWeight: "bold",
    marginBottom: 5,
  },
  pollOption: {
    backgroundColor: 'white',
    color: 'black',
    padding: 8,
    marginVertical: 3,
    borderRadius: 5,
  },
  optionText: {
    color: "black",
    textAlign: "center",
  },

  acceptText: { color: '#FFF', fontWeight: '600' },
  bubble: { borderRadius: 15, padding: 10, marginVertical: 5, maxWidth: '75%' },
  bubbleText: { fontSize: 16 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginRight: 15 },
  checkbox: { marginRight: 5 },
  checkboxText: { fontSize: 16 },
});

export default GroupChatScreen;
