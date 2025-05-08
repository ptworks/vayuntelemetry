import React from 'react';
import Header from '../header/header';
import Footer from '../footer/footer';
import Content from '../mainContent/content';
const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <Content />
      <Footer />
    </div>
  )
}
export default Dashboard