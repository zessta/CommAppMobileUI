import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, TouchableOpacity } from 'react-native';
import * as SignalR from '@microsoft/signalr';
import { UserInfo, ChatSession, GroupInfo } from "../types/models";

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
    users: UserInfo[];
    onSelectUser: (user: UserInfo) => void;
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
    onSelectGroup: (group: GroupInfo) => void;
    onCreateGroup: () => void;
    onGoHome: () => void;
}

const GroupsScreen: React.FC<GroupsScreenProps> = ({ groups, onSelectGroup, onCreateGroup, onGoHome }) => {
    return (
        <View>
            <Text>Groups:</Text>
            <FlatList
                data={groups}
                keyExtractor={(item) => item.GroupId.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => onSelectGroup(item)}>
                        <Text>{item.GroupName}</Text>
                    </TouchableOpacity>
                )}
            />
            <Button title="Create Group" onPress={onCreateGroup} />
            <Button title="Home" onPress={onGoHome} />
        </View>
    );
};

interface GroupChatScreenProps {
    username: string;
    selectedGroup: GroupInfo;
    connection: SignalR.HubConnection;
    onGoBack: () => void;
}

const GroupChatScreen: React.FC<GroupChatScreenProps> = ({ username, selectedGroup, connection, onGoBack }) => {
    const [messages, setMessages] = useState<{ sender: string; message: string; timestamp: string }[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [members, setMembers] = useState<{ userId: number; userName: string }[]>([]);

    useEffect(() => {
        if (connection) {
            connection.on('ReceiveGroupMessage', (groupId: number, sender: string, message: string) => {
                if (groupId === selectedGroup.GroupId) {
                    setMessages(prev => [...prev, { sender, message, timestamp: new Date().toLocaleTimeString() }]);
                }
            });

            connection.invoke("GetGroupMembers", selectedGroup.GroupId)
                .then((membersList) => {
                    setMembers(membersList);
                })
                .catch((error) => console.error("Error fetching group members:", error));
        }
    }, [connection]);

    useEffect(() => {
        const fetchGroupChatHistory = async () => {
            const history = await connection.invoke('GetGroupChatHistory', selectedGroup.GroupId);
            setMessages(history.map((h: { SenderId: number; MessageText: string; Timestamp: string }) => ({
                sender: h.SenderId.toString(), // Convert user ID to string or fetch actual username
                message: h.MessageText,
                timestamp: new Date(h.Timestamp).toLocaleTimeString(),
            })));
        };
        fetchGroupChatHistory();
    }, [selectedGroup]);

    const sendMessage = async () => {
        if (newMessage.trim()) {
            await connection.invoke('SendMessageToGroup', selectedGroup.GroupId, newMessage);
            setMessages(prev => [...prev, { sender: username, message: newMessage, timestamp: new Date().toLocaleTimeString() }]);
            setNewMessage('');
        }
    };

    return (
        <View>
            <Text>Group Chat - {selectedGroup.GroupName}</Text>
            <Text>Members:</Text>
            <FlatList
                data={members}
                keyExtractor={(item) => item.userId.toString()}
                renderItem={({ item }) => <Text>� {item.userName}</Text>}
            />
            <FlatList
                data={messages}
                keyExtractor={(_, index) => index.toString()}
                renderItem={({ item }) => (
                    <Text>{item.timestamp} - {item.sender}: {item.message}</Text>
                )}
            />
            <TextInput value={newMessage} onChangeText={setNewMessage} />
            <Button title="Send" onPress={sendMessage} />
            <Button title="Back" onPress={onGoBack} />
        </View>
    );
};


interface CreateGroupScreenProps {
    users: UserInfo[];
    onCreate: (groupName: string, selectedUsers: UserInfo[]) => void;
    onGoBack: () => void;
}

const CreateGroupScreen: React.FC<CreateGroupScreenProps> = ({ users, onCreate, onGoBack }) => {
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<UserInfo[]>([]);

    const toggleUserSelection = (user : UserInfo) => {
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
    selectedUser: UserInfo;
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
            const history: { fromUser: string; messageText: string; createdOn: string }[] =
                await connection.invoke('GetChatHistory', username, selectedUser.UserName);
            console.log(history);
            setMessages(history.map((h: { fromUser: string; messageText: string; createdOn: string }) => ({
                sender: h.fromUser,
                message: h.messageText,
                timestamp: formatTimestamp(h.createdOn)
            })))
        };
        const formatTimestamp = (timestamp: string) => {
            const parsedDate = new Date(timestamp);
            console.log("time stamp", timestamp);
            console.log("history date", parsedDate);
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
    const [users, setUsers] = useState<UserInfo[]>([]);
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [selectedMenu, setSelectedMenu] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
    const [creatingGroup, setCreatingGroup] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);

    useEffect(() => {
        if (connection) {
            connection.on('UpdateUserList', (userListJson: string) => {
                setUsers(JSON.parse(userListJson));
            });
            connection.on('UpdateGroupList', (groupListJson: string) => {
                setGroups(JSON.parse(groupListJson));
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

        newConnection.on("UpdateGroupList", (groupListJson: string) => {
            try {
                const parsedGroups: GroupInfo[] = JSON.parse(groupListJson);
                setGroups(parsedGroups);
            } catch (error) {
                console.error("Error parsing user list:", error);
            }
        });

        await newConnection.start();
        await newConnection.invoke('NewUser', user);
        await newConnection.invoke('GetGroups'); // Fetch groups on login
        setConnection(newConnection);
        setUsername(user);
    };

    const createGroup = async (groupName: string, selectedUsers: UserInfo[]) => {
        if (connection) {
            await connection.invoke('CreateGroup', groupName, selectedUsers.map(u => u.ConnectionId));
            setCreatingGroup(false);
            setSelectedMenu('groups');
        }
    };

    if (!username) {
        return <LoginScreen onLogin={joinChat} />;
    }

    if (creatingGroup) {
        return <CreateGroupScreen users={users} onCreate={createGroup} onGoBack={() => setCreatingGroup(false)} />;
    }

    if (selectedGroup) {
        return <GroupChatScreen username={username} selectedGroup={selectedGroup} connection={connection!} onGoBack={() => setSelectedGroup(null)} />;
    }

    if (selectedUser) {
        return <ChatScreen username={username} selectedUser={selectedUser} connection={connection!} />;
    }

    if (selectedMenu === 'users') {
        return <UsersScreen users={users} onSelectUser={setSelectedUser} onGoHome={() => setSelectedMenu(null)} />;
    }

    if (selectedMenu === 'groups') {
        return <GroupsScreen groups={groups} onSelectGroup={setSelectedGroup} onCreateGroup={() => setCreatingGroup(true)} onGoHome={() => setSelectedMenu(null)} />;
    }


    return <HomeScreen username={username} onSelectMenu={setSelectedMenu} />;
};

export default App;