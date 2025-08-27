// basic-template.js - 最基础的测试模板

const basicWxml = `
<view class="container">
  <text class="title">Hello World</text>
  <view class="box">
    <text class="content">这是一个测试文本</text>
  </view>
</view>
`;

const basicStyle = {
  container: {
    width: 375,
    height: 400,
    backgroundColor: '#ffffff',
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 24,
    color: '#333333',
    fontWeight: 'bold',
    marginBottom: 20
  },
  box: {
    width: 200,
    height: 100,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10
  },
  content: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center'
  }
};

module.exports = {
  basicWxml,
  basicStyle
};