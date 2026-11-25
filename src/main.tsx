import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import AdminApp from './admin/AdminApp';
import BookPage from './book/BookPage';

function Root() {
  const path = window.location.pathname;
  const adminHost = window.location.hostname.startsWith('admin.');
  if (adminHost || path === '/admin' || path.startsWith('/admin/')) return <AdminApp />;
  if (path === '/book' || path.startsWith('/book/')) return <BookPage />;
  return <App />;
}

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <Root />
  </StrictMode>
);

