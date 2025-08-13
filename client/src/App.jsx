import React, { useRef, useEffect, useCallback } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import Login from './components/pages/Login';
import Feed from './components/pages/Feed';
import Message from './components/pages/Message';
import ChatBox from './components/pages/ChatBox';
import Connections from './components/pages/Connections';
import Discover from './components/pages/Discover';
import Profile from './components/pages/Profile';
import CreatePost from './components/pages/CreatePost';
import { useUser, useAuth } from '@clerk/clerk-react';
import Layout from './components/pages/Layout';
import toast, { Toaster } from 'react-hot-toast';
import { useDispatch } from 'react-redux';
import { fetchUser } from './features/user/userSlice.js';
import { fetchConnections } from './features/connections/connectionSlice.js';
import { addMessage } from './features/messages/messagesSlice.js';
import Notification from './components/Notification.jsx';

function App() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const location = useLocation();
  const pathnameRef = useRef(location);
  const dispatch = useDispatch();

  useEffect(() => {
    pathnameRef.current = location;
  }, [location]);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        const token = await getToken();
        dispatch(fetchUser(token));
        dispatch(fetchConnections(token));
      }
    };
    fetchData();
  }, [user, getToken, dispatch]);
  
  const connectSSE = useCallback(async () => {
    if (!user) return;

    const token = await getToken();
    const eventSource = new EventSource(
      `${import.meta.env.VITE_BASEURL}/api/message/${user.id}?token=${token}`
    );

    eventSource.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const fromUserId = message.from_user_id?._id || message.from_user_id?.id || '';

        if (pathnameRef.current.pathname === `/messages/${fromUserId}`) {
          dispatch(addMessage(message));
        } else {
          toast.custom(
            (t) => <Notification t={t} message={message} />,
            { position: 'bottom-right' }
          );
        }
      } catch (e) {
        console.error('Error parsing SSE message:', e);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE error:', err);
      eventSource.close();
    };
    
    return eventSource;
  }, [user, getToken, dispatch]);


  useEffect(() => {
    let eventSource;
    
    const initialize = async () => {
      eventSource = await connectSSE();
    };

    if (user) {
      initialize();
    }
    
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [user, connectSSE]);

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={!user ? <Login /> : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Message />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          {/* FIX: Added element= before the component prop */}
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileId" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;