// chat-template.js - 聊天界面的WXML模板和样式定义

const chatWxml = (messages) => `
<view class="chatContainer">
  <view class="chatHeader">
    <text class="headerTitle">聊天记录</text>
  </view>
  <view class="messageList">
    ${messages.map((message, index) => `
      <view class="messageItem ${message.isOwn ? 'ownMessage' : 'otherMessage'}">
        ${!message.isOwn ? `
          <view class="avatar">
            <text class="avatarText">${message.nickname ? message.nickname.charAt(0) : 'A'}</text>
          </view>
        ` : ''}
        <view class="messageContent">
          ${!message.isOwn && message.nickname ? `
            <view class="nickname">
              <text class="nicknameText">${message.nickname}</text>
            </view>
          ` : ''}
          <view class="messageBubble ${message.isOwn ? 'ownBubble' : 'otherBubble'}">
            <text class="messageText">${message.message}</text>
          </view>
          <view class="messageTime">
            <text class="timeText">${message.time}</text>
          </view>
        </view>
        ${message.isOwn ? `
          <view class="avatar ownAvatar">
            <text class="avatarText">我</text>
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
    display: 'flex',
    flexDirection: 'column',
    minHeight: 600
  },
  chatHeader: {
    width: 375,
    height: 60,
    backgroundColor: '#393a3e',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2c2d30',
    borderBottomStyle: 'solid'
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
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#ededed'
  },
  messageItem: {
    width: 345,
    marginBottom: 15,
    display: 'flex',
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
    display: 'flex',
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
    display: 'flex',
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
    maxWidth: 250,
    minWidth: 60,
    display: 'flex',
    alignItems: 'center'
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d6d7da',
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
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap'
  },
  messageTime: {
    marginTop: 5,
    display: 'flex',
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