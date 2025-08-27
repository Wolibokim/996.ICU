// simple-template.js - 简化的聊天界面模板

const simpleWxml = (messages) => `
<view class="container">
  <view class="header">
    <text class="title">聊天记录</text>
  </view>
  ${messages.map((message, index) => `
    <view class="messageWrapper">
      <view class="messageBubble ${message.isOwn ? 'ownBubble' : 'otherBubble'}">
        <text class="messageText">${message.message}</text>
      </view>
      <text class="timeText">${message.time}</text>
    </view>
  `).join('')}
</view>
`;

const simpleStyle = {
  container: {
    width: 375,
    backgroundColor: '#f5f5f5',
    padding: 20,
    display: 'flex',
    flexDirection: 'column'
  },
  header: {
    width: 335,
    height: 50,
    backgroundColor: '#007aff',
    borderRadius: 8,
    marginBottom: 20,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },
  title: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold'
  },
  messageWrapper: {
    width: 335,
    marginBottom: 15,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start'
  },
  messageBubble: {
    maxWidth: 250,
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
    display: 'flex'
  },
  ownBubble: {
    backgroundColor: '#95EC69',
    alignSelf: 'flex-end'
  },
  otherBubble: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderStyle: 'solid',
    alignSelf: 'flex-start'
  },
  messageText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 20
  },
  timeText: {
    fontSize: 12,
    color: '#999999',
    alignSelf: 'center'
  }
};

// 为不同消息类型设置不同的气泡背景色
const getBubbleStyle = (isOwn) => {
  return {
    ...simpleStyle.bubble,
    backgroundColor: isOwn ? '#95EC69' : '#ffffff'
  };
};

module.exports = {
  simpleWxml,
  simpleStyle,
  getBubbleStyle
};