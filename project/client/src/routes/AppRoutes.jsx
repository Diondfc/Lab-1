import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from '../components/Layout/MainLayout.jsx'
import RegisterPage from '../pages/RegisterPage.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import HomePage from '../pages/HomePage.jsx'
import AdminPanel from '../pages/AdminPanel.jsx'
import About from '../pages/About.jsx'
import Events from '../pages/Events.jsx'
import EventsDashboard from '../pages/EventsDashboard.jsx'
import EventsLocations from '../pages/EventsLocations.jsx'
import BookList from '../components/Books/BookList.jsx'
import BookDetail from '../components/Books/BookDetail.jsx'
import BookListAcademic from '../components/Books/BookListAcademic.jsx'
import BookListJournal from '../components/Books/BookListJournal.jsx'
import BookListNovel from '../components/Books/BookListNovel.jsx'
import EditBook from '../components/Books/EditBook.jsx'
import AddBook from '../components/Books/AddBook.jsx'
import JournalsDashboard from '../components/Books/JournalsDashboard.jsx'
import AcademicDashboard from '../components/Books/AcademicDashboard.jsx'
import NovelsDashboard from '../components/Books/NovelsDashboard.jsx'
import LoansDashboard from '../components/Loans/LoanDashboard.jsx'
import AddLoanForm from '../components/Loans/AddLoanForm.jsx'
import LoanHistory from '../components/Loans/LoanHistory.jsx'
import ReturnForm from '../components/Loans/ReturnForm.jsx'
import Fines from '../components/Loans/Fine.jsx'
import Bookshelf from '../components/Rating/Bookshelf.jsx'
import AdminRoute from '../components/Auth/AdminRoute.jsx'
import BookClub from '../pages/BookClub.jsx'
import EditEvents from '../pages/EditEvents.jsx'
import RatingDashboard from '../components/Rating/RatingDashboard.jsx'
import RoleHistoryDashboard from '../pages/RoleHistoryDashboard.jsx'
import UserManagementDashboard from '../pages/UserManagementDashboard.jsx'
import ReservationQueueDashboard from '../pages/ReservationQueueDashboard.jsx'
import AuditLogsDashboard from '../pages/AuditLogsDashboard.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<RegisterPage />} />
        <Route path="/register" element={<Navigate to="/" replace />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/events" element={<Events />} />
        <Route path="/events/locations" element={<EventsLocations />} />
        <Route path="/books" element={<BookList />} />
        <Route path="/books/:id" element={<BookDetail />} />
        <Route path="/academic" element={<BookListAcademic />} />
        <Route path="/journals" element={<BookListJournal />} />
        <Route path="/novels" element={<BookListNovel />} />
        <Route element={<AdminRoute />}>
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/events/dashboard" element={<EventsDashboard />} />
          <Route path="/admin/events/edit/:id" element={<EditEvents />} />
          <Route path="/admin/ratings" element={<RatingDashboard />} />
          <Route path="/admin/role-history" element={<RoleHistoryDashboard />} />
          <Route path="/admin/users" element={<UserManagementDashboard />} />
          <Route path="/admin/reservations" element={<ReservationQueueDashboard />} />
          <Route path="/admin/audit-logs" element={<AuditLogsDashboard />} />
          <Route path="/edit/:id" element={<EditBook />} />
          <Route path="/admin/add-book" element={<AddBook />} />
          <Route path="/admin/journals-dashboard" element={<JournalsDashboard />} />
          <Route path="/admin/academic-dashboard" element={<AcademicDashboard />} />
          <Route path="/admin/novels-dashboard" element={<NovelsDashboard />} />
          <Route path="/admin/loans" element={<LoansDashboard />} />
          <Route path="/admin/add-loan" element={<AddLoanForm />} />
        </Route>
        <Route path="/loan-book" element={<AddLoanForm />} />
        <Route path="/loan-history" element={<LoanHistory />} />
        <Route path="/process-return" element={<ReturnForm />} />
        <Route path="/fines" element={<Fines />} />
        <Route path="/bookshelf" element={<Bookshelf />} />
        <Route path="/book-club" element={<BookClub />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
