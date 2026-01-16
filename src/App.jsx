import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FamilyMemberSelect from './pages/FamilyMemberSelect'
import CalendarMemberSelect from './pages/CalendarMemberSelect'
import Calendar from './pages/Calendar'
import RecordDetail from './pages/RecordDetail'
import Medical from './pages/Medical'
import My from './pages/My'
import TabBar from './components/TabBar'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FamilyMemberSelect />} />
        <Route path="/calendar/:memberId" element={<Calendar />} />
        <Route path="/record/:memberId/:date" element={<RecordDetail />} />
        <Route path="/medical" element={<Medical />} />
        <Route path="/my" element={<My />} />
      </Routes>
      <TabBar />
    </Router>
  )
}

export default App
