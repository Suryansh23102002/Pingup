import React, { useEffect, useRef, useState } from 'react'
import { ImageIcon, SendHorizonal } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import api from '../../api/axios.js'
import { addMessage, fetchMessages, resetMessages } from '../../features/messages/messagesSlice.js'
import toast from 'react-hot-toast'

function ChatBox() {
  const { messages } = useSelector((state) => state.messages)
  const { userId } = useParams()
  const { getToken } = useAuth()
  const dispatch = useDispatch()
  
  // FIX: Get the currently logged-in user from the Redux store
  const currentUser = useSelector((state) => state.user.value);
  const connections = useSelector((state) => state.connections.connections)

  const [text, setText] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null) // This is the person being chatted with
  const messagesEndRef = useRef(null)

  const fetchUserMessages = async () => {
    try {
      const token = await getToken()
      dispatch(fetchMessages({ token, userId }))
    } catch (error) {
      toast.error(error.message)
    }
  }

  const sendMessage = async () => {
    try {
      if (!text && !image) return

      const token = await getToken()
      const formData = new FormData()
      formData.append('to_user_id', userId)
      formData.append('text', text)
      image && formData.append('image', image)

      const { data } = await api.post('api/message/send', formData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (data.success) {
        setText('')
        setImage(null)
        dispatch(addMessage(data.message))
      } else {
        throw new Error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    fetchUserMessages()

    return () => {
      dispatch(resetMessages())
    }
  }, [userId])

  useEffect(() => {
    if (connections.length > 0 ) {
      const chatPartner = connections.find((connection) => connection._id === userId)
      setUser(chatPartner)
    }
  }, [connections, userId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="flex items-center gap-2 p-2 md:px-10 xl:pl-42 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-300">
        {user ? (
          <>
            <img src={user.profile_picture} alt="" className="w-8 h-8 rounded-full" />
            <div>
              <p className="font-medium">{user.full_name}</p>
              <p className="text-sm text-gray-500 -mt-1.5">@{user.username}</p>
            </div>
          </>
        ) : (
          <p>Loading user info...</p>
        )}
      </div>
      <div className="p-5 md:px-10 h-full overflow-y-scroll">
        <div className="space-y-4 max-w-4xl mx-auto">
          {[...messages]
            .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
            .map((message) => {
              // FIX: Correctly determine if the message was sent by the logged-in user
              const isSentByMe = message.from_user_id === currentUser?._id;
              
              return (
                <div
                  key={message._id || message.id}
                  className={`flex flex-col ${isSentByMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    // FIX: Apply different styles for sent vs. received messages
                    className={`p-2 px-3 text-sm max-w-sm rounded-lg shadow ${
                      isSentByMe 
                      ? 'rounded-br-none bg-indigo-500 text-white' 
                      : 'rounded-bl-none bg-slate-200 text-slate-800'
                    }`}
                  >
                    {message.message_type === 'image' && (
                      <img
                        src={message.media_url}
                        className="w-full max-w-sm rounded-lg mb-1"
                        alt=""
                      />
                    )}
                    <p>{message.text}</p>
                  </div>
                </div>
              )
            })}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="px-4">
        <div className="flex items-center gap-3 pl-5 p-1.5 bg-white w-full max-w-xl mx-auto border border-gray-200 shadow rounded-full mb-5">
          <input
            type="text"
            className="flex-1 outline-none text-slate-700"
            placeholder="Type a message..."
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            onChange={(e) => setText(e.target.value)}
            value={text}
          />
          <label htmlFor="image">
            {image ? (
              <img src={URL.createObjectURL(image)} alt="" className="h-8 rounded" />
            ) : (
              <ImageIcon size={28} className="text-gray-400 cursor-pointer" />
            )}
            <input
              type="file"
              id="image"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files[0])}
            />
          </label>
          <button
            onClick={sendMessage}
            className="bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-700 hover:to-purple-800 active:scale-95 cursor-pointer text-white p-2 rounded-full"
          >
            <SendHorizonal size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ChatBox