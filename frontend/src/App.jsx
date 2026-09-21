import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './App.css';

import Navbar from './components/BayeneNavbar';
import Carousel from './components/BayeneHome';
import Cart from './components/BayenePanier';
import AdminPanel from './features/AdminPanel';
import { CollectionsOverview, CollectionDetail, ProductDetail } from './components/Collection';
import Login from './components/Login';
import BayeneFooter from './components/bayenFooter';
import ContactSection from './components/Contact';
import AdminLogin from './components/AdminLogin';
import Success from './components/Success';


function App() {
  const { userInfo } = useSelector((state) => state.user);

  const isAuthenticated = !!userInfo;
  const isApproved = userInfo?.isApproved === true || userInfo?.role === 'admin';
  const isAdmin = userInfo?.role === 'admin' || userInfo?.isAdmin === true;

  return (
    <>
      <Navbar />
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Carousel />} />
          
          <Route 
            path="/cart" 
            element={isAuthenticated && isApproved ? <Cart /> : <Navigate to="/login" replace />} 
          />
          
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/collection" replace /> : <Login />} 
          />
          
          {/* Espace Compte → redirige vers collection pour l'instant */}
          <Route 
            path="/account" 
            element={isAuthenticated ? <CollectionsOverview /> : <Navigate to="/login" replace />} 
          />

        <Route
        path="/admin"
       element={
         isAdmin ? (
         <AdminPanel />
          ) : (
          <AdminLogin />
    )
  }
/>
          
          <Route path="/collection" element={<CollectionsOverview />} />
          <Route path="/collection/:collectionId" element={<CollectionDetail />} />
          <Route path="/product/:productId" element={<ProductDetail />} />

          <Route path="/contact" element={<ContactSection />} />
<Route path="/success" element={<Success />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BayeneFooter />
      </div>
    </>
  );
}

export default App;