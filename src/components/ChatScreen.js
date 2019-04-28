
import React, { Component } from 'react';
import './../App.css';
import RoomList from './RoomList'
import MessageList from './MessageList'
import SendMessageForm from './SendMessageForm'
import NewRoomForm from './NewRoomForm'
import { tokenUrl, instanceLocator } from '../config'
import ChatKit from '@pusher/chatkit-client'

class ChatScreen extends Component {
  constructor() {
    super()
    this.state = {
      loading: null,
      roomId: null,
      messages: [],
      joinableRooms: [],
      joinedRooms: [],
    }
    this.sendMessage = this.sendMessage.bind(this)
    this.subscribeToRoom = this.subscribeToRoom.bind(this)
    this.getRooms = this.getRooms.bind(this)
    this.createRoom = this.createRoom.bind(this)
  }

  componentDidMount() {
    this.setState({loading: true})
    const chatManager = new ChatKit.ChatManager({
      instanceLocator,
      userId: this.props.currentUsername,
      tokenProvider: new ChatKit.TokenProvider({
        url: 'http://localhost:3001/authenticate'
      })

    })

    chatManager.connect()
      .then(currentUser => {
        this.currentUser = currentUser
        this.getRooms()
        this.setState({
          loading: false
        })
      })
      .catch(err => console.log('error on joinableRooms: ', err))
      
    
  }

  getRooms() {
    this.currentUser.getJoinableRooms()
          .then(joinableRooms =>{
            this.setState({
              joinableRooms,
              joinedRooms: this.currentUser.rooms
            })
          })
        .catch(err => console.log('error on joinableRooms: ', err))
  }

  subscribeToRoom(roomId) {
    this.setState({
      messages: []
    })
    this.currentUser.subscribeToRoom({
      roomId: roomId,
      messageLimit: 20,
      hooks: {
        onMessage: message => {
          // console.log("Received message:", message.text)
          this.setState({
            messages: [...this.state.messages, message]
          })
        }
      }
    })
    .then(room => {
      this.setState({
        roomId: room.id
      })
      this.getRooms()
    })
    .catch(err => console.log('error on subscribing to room: ',err))
  }
  

  sendMessage(text) {
    this.currentUser.sendMessage({
      text: text,
      roomId: this.state.roomId
    })
  }

  createRoom(name) {
    this.currentUser.createRoom({
      name
    })
    .then(room => this.subscribeToRoom(room.id))
    .catch(err => console.log("error on createRoom",err))
  }

  render() {
    return (
      <div className="app">
        <RoomList 
          loading={this.state.loading}
          roomId={this.state.roomId}
          subscribeToRoom={this.subscribeToRoom} 
          rooms={[...this.state.joinableRooms,...this.state.joinedRooms]}
        />
        <MessageList 
          messages={this.state.messages}
          roomId={this.state.roomId}
          username={this.props.currentUsername}
        />
        <SendMessageForm 
          sendMessage={this.sendMessage}
          disabled={!this.state.roomId}
        />
        <NewRoomForm createRoom={this.createRoom}/>

      </div>
    );
  }
}

export default ChatScreen;
