import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Login from './components/pages/Login'
import Feed from './components/pages/Feed'
import Message from './components/pages/Message'
import ChatBox from './components/pages/ChatBox'
import Connections from './components/pages/Connections'
import Discover from './components/pages/Discover'
import Profile from './components/pages/Profile'
import CreatePost from './components/pages/CreatePost'
import { useUser } from '@clerk/clerk-react'
import Layout from './components/pages/Layout'
import {Toaster} from 'react-hot-toast'

function App() {
  const { user } = useUser() // ✅ must call the hook

  return (
    <>
      <Toaster />
      <Routes>
        <Route path="/" element={!user ? <Login/>  : <Layout />}>
          <Route index element={<Feed />} />
          <Route path="messages" element={<Message />} />
          <Route path="messages/:userId" element={<ChatBox />} />
          <Route path="connections" element={<Connections />} />
          <Route path="discover" element={<Discover />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/:profileID" element={<Profile />} />
          <Route path="create-post" element={<CreatePost />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
