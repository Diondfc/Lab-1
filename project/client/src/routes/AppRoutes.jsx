import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../components/Layout/MainLayout.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import AdminPanel from '../pages/AdminPanel.jsx'
import About from '../pages/About.jsx'
import BookList from '../components/Books/BookList.jsx'
import BookDetail from '../components/Books/BookDetail.jsx'
import BookListAcademic from '../components/Books/BookListAcademic.jsx'
import BookListJournal from '../components/Books/BookListJournal.jsx'
import BookListNovel from '../components/Books/BookListNovel.jsx'
import EditBook from '../components/Books/EditBook.jsx'
export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/about" element={<About />} />
        <Route path="/books" element={<BookList />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/academic" element={<BookListAcademic />} />
        <Route path="/journals" element={<BookListJournal />} />
        <Route path="/novels" element={<BookListNovel />} />
        <Route path="/edit/:id" element={<EditBook />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}