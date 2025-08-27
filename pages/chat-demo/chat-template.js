// chat-template.js - 聊天界面的WXML模板和样式定义

const chatWxml = (messages) => `
<view class="chat-container">
  <view class="chat-header">
    <text class="header-title">聊天记录</text>
  </view>
  <view class="message-list">
    ${messages.map((message, index) => `
      <view class="message-item ${message.isOwn ? 'own-message' : 'other-message'}" data-index="${index}">
        ${!message.isOwn ? `
          <view class="avatar">
            <text class="avatar-text">${message.nickname ? message.nickname.charAt(0) : 'A'}</text>
          </view>
        ` : ''}
        <view class="message-content">
          ${!message.isOwn && message.nickname ? `
            <view class="nickname">
              <text class="nickname-text">${message.nickname}</text>
            </view>
          ` : ''}
          <view class="message-bubble ${message.isOwn ? 'own-bubble' : 'other-bubble'}">
            <text class="message-text">${message.message}</text>
          </view>
          <view class="message-time">
            <text class="time-text">${message.time}</text>
          </view>
        </view>
        ${message.isOwn ? `
          <view class="avatar own-avatar">
            <text class="avatar-text">我</text>
          </view>
        ` : ''}
      </view>
    `).join('')}
  </view>
</view>
`;

const chatStyle = {
  chatContainer: {
    width: 375,
    backgroundColor: '#ededed',
    flexDirection: 'column',
    minHeight: 600
  },
  chatHeader: {
    width: 375,
    height: 60,
    backgroundColor: '#393a3e',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottom: '1px solid #2c2d30'
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff'
  },
  messageList: {
    width: 375,
    flex: 1,
    paddingTop: 15,
    paddingBottom: 15,
    paddingLeft: 15,
    paddingRight: 15,
    flexDirection: 'column',
    backgroundColor: '#ededed'
  },
  messageItem: {
    width: 345,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  ownMessage: {
    flexDirection: 'row-reverse'
  },
  otherMessage: {
    flexDirection: 'row'
  },
  avatar: {
    width: 40,
    height: 40,
    backgroundColor: '#c8c9cc',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    flexShrink: 0
  },
  ownAvatar: {
    backgroundColor: '#07c160',
    marginRight: 0,
    marginLeft: 10
  },
  avatarText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  messageContent: {
    maxWidth: 250,
    flexDirection: 'column',
    flex: 1
  },
  nickname: {
    marginBottom: 5
  },
  nicknameText: {
    fontSize: 12,
    color: '#888888'
  },
  messageBubble: {
    paddingTop: 12,
    paddingBottom: 12,
    paddingLeft: 15,
    paddingRight: 15,
    borderRadius: 6,
    position: 'relative',
    maxWidth: 250,
    minWidth: 60
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderColor: '#d6d7da',
    borderWidth: 1,
    borderStyle: 'solid',
    marginLeft: 6
  },
  ownBubble: {
    backgroundColor: '#95EC69',
    marginRight: 6
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    wordBreak: 'break-all'
  },
  messageTime: {
    marginTop: 5,
    flexDirection: 'row'
  },
  timeText: {
    fontSize: 11,
    color: '#999999'
  }
};

module.exports = {
  chatWxml,
  chatStyle
};