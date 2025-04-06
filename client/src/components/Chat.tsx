import { useState } from 'react';

const Chat = () => {
  const [activeContact, setActiveContact] = useState(1);
  const [messageInput, setMessageInput] = useState('');

  // Sample data - in a real app, this would come from API/props
  const contacts = [
    {
      id: 1,
      name: 'Sarah Williams',
      avatar: 'https://i.pravatar.cc/150?u=sarah',
      lastMessage: 'Are we still meeting today?',
      time: '10:45 AM',
      unread: 2,
      online: true
    },
    {
      id: 2,
      name: 'John Miller',
      avatar: 'https://i.pravatar.cc/150?u=john',
      lastMessage: 'The game was amazing!',
      time: 'Yesterday',
      unread: 0,
      online: false
    },
    {
      id: 3,
      name: 'Emma Davis',
      avatar: 'https://i.pravatar.cc/150?u=emma',
      lastMessage: 'Looking forward to our tennis match',
      time: 'Yesterday',
      unread: 0,
      online: true
    },
    {
      id: 4,
      name: 'Michael Chen',
      avatar: 'https://i.pravatar.cc/150?u=michael',
      lastMessage: 'Thanks for organizing the event',
      time: 'Monday',
      unread: 0,
      online: false
    }
  ];

  const messages = [
    {
      id: 1,
      contactId: 1,
      text: 'Hey there! How are you doing today?',
      time: '10:30 AM',
      isOutgoing: false
    },
    {
      id: 2,
      contactId: 1,
      text: "I'm good, thanks! Just finishing up some work.",
      time: '10:32 AM',
      isOutgoing: true
    },
    {
      id: 3,
      contactId: 1,
      text: 'Are we still meeting today for the basketball practice?',
      time: '10:45 AM',
      isOutgoing: false
    },
    {
      id: 4,
      contactId: 2,
      text: 'Did you see the game last night?',
      time: 'Yesterday',
      isOutgoing: false
    },
    {
      id: 5,
      contactId: 2,
      text: 'Yes! It was incredible. Our team played really well.',
      time: 'Yesterday',
      isOutgoing: true
    }
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      // In a real app, this would send the message to an API
      console.log('Sending message:', messageInput);
      setMessageInput('');
    }
  };

  const activeContactData = contacts.find(contact => contact.id === activeContact);
  const activeContactMessages = messages.filter(message => message.contactId === activeContact);

  return (
    <div className="flex h-[700px] bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Chat Sidebar */}
      <div className="w-80 border-r border-gray-100 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Messages</h3>
            <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {contacts.reduce((count, contact) => count + contact.unread, 0)}
            </span>
          </div>
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search contacts..." 
              className="w-full p-2 pl-8 text-sm border border-gray-200 rounded-md"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {contacts.map(contact => (
            <div 
              key={contact.id}
              className={`flex items-center p-4 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${contact.id === activeContact ? 'bg-gray-50' : ''}`}
              onClick={() => setActiveContact(contact.id)}
            >
              <div className="relative flex-shrink-0 mr-3">
                <img src={contact.avatar} alt={contact.name} className="w-12 h-12 rounded-full" />
                {contact.online && <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-white"></div>}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between mb-1">
                  <span className="font-medium truncate">{contact.name}</span>
                  <span className="text-xs text-text-light">{contact.time}</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-text-light truncate pr-2">{contact.lastMessage}</p>
                  {contact.unread > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                      {contact.unread}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Chat Main Area */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center">
            <img 
              src={activeContactData?.avatar} 
              alt={activeContactData?.name}
              className="w-10 h-10 rounded-full mr-3"
            />
            <div>
              <h4 className="font-medium">{activeContactData?.name}</h4>
              <span className={`text-xs ${activeContactData?.online ? 'text-success' : 'text-text-light'}`}>
                {activeContactData?.online ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <span role="img" aria-label="Call">📞</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <span role="img" aria-label="Video">📹</span>
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
              <span role="img" aria-label="More">⋯</span>
            </button>
          </div>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto">
          <div className="relative text-center mb-6">
            <span className="bg-gray-100 text-text-light text-xs px-3 py-1 rounded-full">Today</span>
          </div>
          
          {activeContactMessages.map(message => (
            <div 
              key={message.id}
              className={`flex mb-4 ${message.isOutgoing ? 'justify-end' : 'justify-start'}`}
            >
              {!message.isOutgoing && (
                <img 
                  src={activeContactData?.avatar} 
                  alt={activeContactData?.name}
                  className="w-8 h-8 rounded-full mr-2 self-end"
                />
              )}
              
              <div className={`max-w-[70%]`}>
                <div className={`p-3 rounded-lg relative ${message.isOutgoing ? 'bg-primary text-white rounded-br-none' : 'bg-gray-100 text-text-dark rounded-bl-none'}`}>
                  {message.text}
                  <div className={`text-xs mt-1 ${message.isOutgoing ? 'text-white/70' : 'text-text-light'}`}>{message.time}</div>
                </div>
              </div>
              
              {message.isOutgoing && (
                <img 
                  src="https://i.pravatar.cc/150?u=me" 
                  alt="Me"
                  className="w-8 h-8 rounded-full ml-2 self-end"
                />
              )}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 flex items-center">
          <button 
            type="button" 
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-text-light hover:text-primary transition-colors"
          >
            <span role="img" aria-label="Attach">📎</span>
          </button>
          
          <input
            type="text"
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 mx-2 p-3 border border-gray-200 rounded-full focus:outline-none focus:border-primary"
          />
          
          <button 
            type="submit" 
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white"
            disabled={!messageInput.trim()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat; 