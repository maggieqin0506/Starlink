import React from 'react';
import Header from './Header';
import Footer from './Footer'
import Main from './Main'

function App() {
  return (
    <div className="App">
      <Header />
      <Main />
      <Footer />
    </div>
  );
}

// 向外暴露，使得外面的组件可以使用
// 组件之间的引用就是由 暴露 引用 来使用的
export default App;
