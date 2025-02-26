import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import * as SignalR from '@microsoft/signalr';
import { UserInfo, ChatSession,GroupInfo } from "../types/models";

interface User {
    ConnectionId: string;
    UserName: string;
}

interface LoginScreenProps {
    onLogin: (username: string) => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
    const [username, setUsername] = useState<string>('');

    const handleLogin = () => {
        if (username.trim()) {
            onLogin(username);
        }
    };

    return (
        <View>
            <Text>Enter Username:</Text>
            <TextInput value={username} onChangeText={setUsername} />
            <Button title="Join Chat" onPress={handleLogin} />
        </View>
    );
};

interface HomeScreenProps {
    username: string;
    onSelectMenu: (menu: 'users' | 'groups') => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ username, onSelectMenu }) => {
    return (
        <View>
            <Text>Welcome, {username}!</Text>
            <Button title="Users" onPress={() => onSelectMenu('users')} />
            <Button title="Groups" onPress={() => onSelectMenu('groups')} />
        </View>
    );
};

interface UsersScreenProps {
    users: User[];
    onSelectUser: (user: User) => void;
    onGoHome: () => void;
}

const UsersScreen: React.FC<UsersScreenProps> = ({ users, onSelectUser, onGoHome }) => {
    return (
        <View>
            <Text>Online Users:</Text>
            <FlatList 
                data={users}
                keyExtractor={item => item.ConnectionId}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onSelectUser(item)}>
                        <Text>{item.UserName}</Text>
                    </TouchableOpacity>
                )}
            />
            <Button title="Home" onPress={onGoHome} />

        </View>
    );
};

interface GroupsScreenProps {
    groups: GroupInfo[];
    onCreateGroup: () => void;
    onGoHome: () => void;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ groups, onCreateGroup, onGoHome }) => {
    return (
        <View>
            <Text>Groups:</Text>
            <FlatList 
                data={groups}
                keyExtractor={(item) => item.GroupId}
                renderItem={({ item }) => (
                    <Text>{item.GroupName}</Text>
                )}
            />
            <Button title="Create Group" onPress={onCreateGroup} />
            <Button title="Home" onPress={onGoHome} />
        </View>
    );
};

interface CreateGroupScreenProps {
    users: User[];
    onCreate: (groupName: string, selectedUsers: User[]) => void;
    onGoBack: () => void;
}

const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ users, onCreate, onGoBack }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const toggleUserSelection = (user : User) => {
        setSelectedUsers((prev) => 
            prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]
        );
    };

    const handleCreateGroup = () => {
        if (groupName.trim() && selectedUsers.length > 0) {
            onCreate(groupName, selectedUsers);
        }
    };

    return (
        <View>
            <Text>Group Name:</Text>
            <TextInput value={groupName} onChangeText={setGroupName} />
            <Text>Select Users:</Text>
            <FlatList 
                data={users}
                keyExtractor={item => item.ConnectionId}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => toggleUserSelection(item)}>
                        <Text style={{ backgroundColor: selectedUsers.includes(item) ? 'lightgray' : 'white' }}>
                            {item.UserName}
                        </Text>
                    </TouchableOpacity>
                )}
            />
            <Button title="Create Group" onPress={handleCreateGroup} />
            <Button title="Back" onPress={onGoBack} />
        </View>
    );
};


interface ChatScreenProps {
    username: string;
    selectedUser: User;
    connection: SignalR.HubConnection;
}

interface Message {
    sender: string;
    message: string;
    timestamp: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ username, selectedUser, connection }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');

    useEffect(() => {
        if (connection) {
            connection.on('ReceiveMessage', (sender: string, message: string, recipient: string) => {
                if (recipient === username || sender === username) {
                    setMessages(prev => [...prev, { sender, message, timestamp: new Date().toLocaleTimeString() }]);
                }
            });
        }
    }, [connection]);

    useEffect(() => {
        const fetchChatHistory = async () => {
            const history: { fromUser: string; message: string; timestamp: string }[] = 
                await connection.invoke('GetChatHistory', username, selectedUser.UserName);
                console.log(history);
                setMessages(history.map((h: { fromUser: string; message: string; timestamp: string }) => ({ 
                    sender: h.fromUser, 
                    message: h.message, 
                    timestamp: formatTimestamp(h.timestamp)
                })))
        };
        const formatTimestamp = (timestamp: string) => {
            const parsedDate = new Date(timestamp);
            console.log("time stamp",timestamp);
            console.log("history date",parsedDate);
            if (isNaN(parsedDate.getTime())) {
                return "Invalid Date"; // Fallback in case of a parsing error
            }
            return parsedDate.toLocaleTimeString();
        };
        fetchChatHistory();
    }, [selectedUser]);

    const sendMessage = async () => {
        if (newMessage.trim() && selectedUser) {
            await connection.invoke('SendMessageToUser', newMessage, selectedUser.ConnectionId);
            setMessages(prev => [...prev, { sender: username, message: newMessage, timestamp: new Date().toLocaleTimeString() }]);
            setNewMessage('');
        }
    };

    return (
        <View>
            <Text>Chat with {selectedUser.UserName}</Text>
            <FlatList 
                data={messages}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <Text>{item.timestamp} - {item.sender}: {item.message}</Text>
                )}
            />
            <TextInput value={newMessage} onChangeText={setNewMessage} />
            <Button title="Send" onPress={sendMessage} />
        </View>
    );
};

const App: React.FC = () => {
    const [username, setUsername] = useState<string | null>(null);
    const [connection, setConnection] = useState<SignalR.HubConnection | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [groups, setGroups] = useState([]);
    const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [creatingGroup, setCreatingGroup] = useState(false);

    useEffect(() => {
        if (connection) {
            connection.on('UpdateUserList', (userListJson: string) => {
                setUsers(JSON.parse(userListJson));
            });
        }
    }, [connection]);

    const joinChat = async (user: string) => {
        const newConnection = new SignalR.HubConnectionBuilder()
            .withUrl('https://localhost:44369/signalrtc')
            .withAutomaticReconnect()
            .build();

        //newConnection.onclose(() => setUsername(null));

        newConnection.on("UpdateUserList", (userListJson: string) => {
            try {
              const parsedUsers: UserInfo[] = JSON.parse(userListJson);
              setUsers(parsedUsers);
            } catch (error) {
              console.error("Error parsing user list:", error);
            }
          });

        await newConnection.start();
        await newConnection.invoke('NewUser', user);
        setConnection(newConnection);
        setUsername(user);
    };

    if (!username) {
        return <LoginScreen onLogin={joinChat} />;
    }

    if (selectedUser) {
        return <ChatScreen username={username} selectedUser={selectedUser} connection={connection!} />;
    }

    if (selectedMenu === 'users') {
        return <UsersScreen users={users} onSelectUser={setSelectedUser} onGoHome={() => setSelectedMenu(null)} />;
    }

    if (selectedMenu === 'groups') {
        return <GroupsScreen groups={groups} onCreateGroup={() => setCreatingGroup(true)} onGoHome={() => setSelectedMenu(null)} />;
    }

    return <HomeScreen username={username} onSelectMenu={setSelectedMenu} />;
};

export default App;