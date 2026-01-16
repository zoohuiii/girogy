import { useLocation, useNavigate } from 'react-router-dom'
import '../styles/TabBar.css'

function TabBar() {
  const location = useLocation()
  const navigate = useNavigate()

  // 현재 경로가 어떤 탭에 해당하는지 확인
  const getActiveTab = () => {
    const path = location.pathname
    if (path === '/') return 'home'
    if (path.startsWith('/calendar')) return 'calendar'
    if (path.startsWith('/medical')) return 'medical'
    if (path.startsWith('/my')) return 'my'
    return 'home'
  }

  const activeTab = getActiveTab()

  const handleTabClick = (tab) => {
    switch (tab) {
      case 'home':
        navigate('/')
        break
      case 'calendar':
        // 달력 탭 클릭 시 첫 번째 구성원의 달력으로 이동 (드로어는 Calendar 컴포넌트에서 자동으로 열림)
        const savedMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]')
        if (savedMembers.length > 0) {
          navigate(`/calendar/${savedMembers[0].id}?openDrawer=true`)
        } else {
          navigate('/')
        }
        break
      case 'medical':
        navigate('/medical')
        break
      case 'my':
        navigate('/my')
        break
      default:
        break
    }
  }

  return (
    <div className="tab-bar">
      <button
        className={`tab-item ${activeTab === 'home' ? 'active' : ''}`}
        onClick={() => handleTabClick('home')}
      >
        <span className="tab-icon">🏠</span>
        <span className="tab-label">홈</span>
      </button>
      <button
        className={`tab-item ${activeTab === 'calendar' ? 'active' : ''}`}
        onClick={() => handleTabClick('calendar')}
      >
        <span className="tab-icon">📅</span>
        <span className="tab-label">달력</span>
      </button>
      <button
        className={`tab-item ${activeTab === 'medical' ? 'active' : ''}`}
        onClick={() => handleTabClick('medical')}
      >
        <span className="tab-icon">🏥</span>
        <span className="tab-label">기록톡</span>
      </button>
      <button
        className={`tab-item ${activeTab === 'my' ? 'active' : ''}`}
        onClick={() => handleTabClick('my')}
      >
        <span className="tab-icon">👤</span>
        <span className="tab-label">MY</span>
      </button>
    </div>
  )
}

export default TabBar
