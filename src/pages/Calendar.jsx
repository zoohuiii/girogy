import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import '../styles/Calendar.css'

function Calendar() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [memberName, setMemberName] = useState('')
  const [memberAge, setMemberAge] = useState(null)
  const [memberDiseases, setMemberDiseases] = useState([])
  const [memberAvatar, setMemberAvatar] = useState(null)
  const [records, setRecords] = useState({})
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [familyMembers, setFamilyMembers] = useState([])

  const loadRecords = () => {
    // 모든 localStorage 키를 확인하여 해당 memberId의 기록 찾기
    const allRecords = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${memberId}_`)) {
        const date = key.replace(`${memberId}_`, '')
        try {
          const record = JSON.parse(localStorage.getItem(key))
          if (record) {
            allRecords[date] = record
          }
        } catch (e) {
          // 파싱 오류 무시
        }
      }
    }
    setRecords(allRecords)
  }

  useEffect(() => {
    // 가족 목록 불러오기
    const savedMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]')
    setFamilyMembers(savedMembers)

    // 현재 선택된 구성원 정보 가져오기
    const member = savedMembers.find(m => m.id === parseInt(memberId))
    setMemberName(member?.name || '구성원')
    setMemberAge(member?.age || null)
    // conditions 우선 사용, 없으면 diseases 사용 (호환성)
    const memberConditions = member?.conditions || (member?.diseases ? member.diseases.map(d => ({
      name: d.name || ''
    })) : [])
    setMemberDiseases(memberConditions)
    setMemberAvatar(member?.avatar || null)

    // 기록 불러오기
    loadRecords()

    // URL에 openDrawer 파라미터가 있으면 드로어 열기
    const searchParams = new URLSearchParams(location.search)
    if (searchParams.get('openDrawer') === 'true') {
      setIsDrawerOpen(true)
      // URL에서 파라미터 제거 (뒤로가기 시 다시 열리지 않도록)
      navigate(`/calendar/${memberId}`, { replace: true })
    }
  }, [memberId, location.search, navigate])

  // 가족 목록 업데이트 감지 (localStorage 변경 시)
  useEffect(() => {
    const handleStorageChange = () => {
      const savedMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]')
      setFamilyMembers(savedMembers)
    }
    window.addEventListener('storage', handleStorageChange)
    // 같은 탭에서 localStorage 변경 감지
    const interval = setInterval(() => {
      const savedMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]')
      if (JSON.stringify(savedMembers) !== JSON.stringify(familyMembers)) {
        setFamilyMembers(savedMembers)
      }
    }, 500)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [familyMembers])

  useEffect(() => {
    // 월이 변경될 때 기록 다시 불러오기
    loadRecords()
  }, [currentDate])

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const handleDateClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    navigate(`/record/${memberId}/${dateStr}`)
  }

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1))
  }

  const handleBack = () => {
    navigate('/calendar')
  }

  const handleOpenDrawer = () => {
    setIsDrawerOpen(true)
  }

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false)
  }

  const handleSelectFamilyMember = (selectedMemberId) => {
    navigate(`/calendar/${selectedMemberId}`)
    setIsDrawerOpen(false)
  }

  const formatDate = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const hasRecord = (day) => {
    if (!day) return false
    const dateStr = formatDate(day)
    const record = records[dateStr]
    return record && (record.note || record.exercise || record.exercises || record.rating || record.notes)
  }

  const getRecordRating = (day) => {
    if (!day) return null
    const dateStr = formatDate(day)
    const record = records[dateStr]
    if (!record || !record.rating) return null
    return record.rating
  }

  const days = []
  const weekDays = ['일', '월', '화', '수', '목', '금', '토']

  // 이번 달 요약 계산 (기록 일수, 평균 별점, 운동별 시간)
  const monthlySummary = (() => {
    let count = 0
    let sumRating = 0
    const exerciseStats = {} // { 운동명: 총 시간(분) }

    Object.entries(records).forEach(([dateStr, record]) => {
      const dateObj = new Date(dateStr)
      if (
        dateObj.getFullYear() === year &&
        dateObj.getMonth() === month
      ) {
        if (record.rating) {
          count += 1
          sumRating += record.rating
        }

        // 운동 기록 집계 (여러 운동 + 레거시 구조 모두 지원)
        const statsForRecord = (rec) => {
          // 새 구조: exercises 배열
          if (rec.exercises && Array.isArray(rec.exercises)) {
            rec.exercises.forEach((ex) => {
              if (!ex || !ex.type) return
              const exerciseName = ex.type
              const duration = ex.duration ? parseInt(ex.duration) || 0 : 0
              if (duration <= 0) return
              if (!exerciseStats[exerciseName]) {
                exerciseStats[exerciseName] = 0
              }
              exerciseStats[exerciseName] += duration
            })
          } else if (rec.exercise && rec.exercise.type) {
            // 레거시 단일 운동 구조
            const exerciseName = rec.exercise.type
            const duration = rec.exercise.duration ? parseInt(rec.exercise.duration) || 0 : 0
            if (duration <= 0) return
            if (!exerciseStats[exerciseName]) {
              exerciseStats[exerciseName] = 0
            }
            exerciseStats[exerciseName] += duration
          }
        }

        statsForRecord(record)
      }
    })

    const average = count > 0 ? (sumRating / count).toFixed(1) : null

    // 운동별 시간을 시:분 형식으로 변환
    const exerciseStatsFormatted = Object.entries(exerciseStats).map(([name, minutes]) => {
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      return {
        name,
        hours,
        minutes: mins,
        totalMinutes: minutes,
      }
    })

    // 월간 운동 총합 계산 (모든 운동의 duration 합)
    const totalExerciseMinutes = Object.values(exerciseStats).reduce((sum, minutes) => sum + minutes, 0)

    // 격려 문구 결정 (20시간 조건이 가장 우선)
    let encouragementMessage = ''
    if (totalExerciseMinutes >= 1200) {
      // 20시간 이상
      encouragementMessage = '지방보다 근육이 더 많아졌겠어요. 멋있는 사람!'
    } else if (totalExerciseMinutes >= 600) {
      // 10시간 이상
      encouragementMessage = '체력 나이 -10살 축하드립니다'
    } else if (totalExerciseMinutes >= 60) {
      // 1시간 이상
      encouragementMessage = '시작이 반이라는 말이 있죠. 화이팅!'
    }

    return {
      count,
      average,
      exercises: exerciseStatsFormatted,
      totalExerciseMinutes,
      encouragementMessage,
    }
  })()

  // 빈 칸 추가
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null)
  }

  // 날짜 추가
  for (let day = 1; day <= daysInMonth; day++) {
    days.push(day)
  }

  return (
    <div className="calendar">
      <div className="calendar-header">
        <button className="hamburger-button" onClick={handleOpenDrawer} aria-label="메뉴 열기">
          ≡
        </button>
        <button className="back-button" onClick={handleBack}>←</button>
        <div className="calendar-header-member">
          <div className="calendar-header-avatar">
            {memberAvatar ? (
              <img src={memberAvatar} alt={memberName} />
            ) : (
              <span className="calendar-avatar-placeholder">
                {memberName?.[0] ?? '?'}
              </span>
            )}
          </div>
          <div className="calendar-header-info">
            <h1>{memberName}</h1>
            {memberAge && <span className="calendar-header-age">({memberAge}세)</span>}
          </div>
        </div>
      </div>
      
      {/* 인물 카드 (와이어프레임 스타일) */}
      <div className="calendar-member-card">
        <div className="calendar-member-main">
          <div className="calendar-member-name-line">
            {memberName}
            {memberAge ? ` (${memberAge}세)` : ''}
          </div>
          {memberDiseases.length > 0 && (
            <div className="calendar-member-disease-line">
              {memberDiseases.map((disease, idx) => (
                <span key={idx} className="calendar-disease-tag">
                  {disease.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="month-navigation">
        <button onClick={handlePrevMonth}>◀</button>
        <h2>{year}년 {month + 1}월</h2>
        <button onClick={handleNextMonth}>▶</button>
      </div>
      <div className="calendar-grid">
        {weekDays.map((day) => (
          <div key={day} className="weekday">{day}</div>
        ))}
        {days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${day ? 'has-date' : 'empty'}`}
            onClick={() => day && handleDateClick(day)}
          >
            {day && (
              <>
                <span className="day-number">{day}</span>
                {hasRecord(day) && (
                  <span className="record-indicator">
                    ★{getRecordRating(day) !== null ? ` ${getRecordRating(day)}` : ''}
                  </span>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      <div className="month-summary">
        <h3>이번 달 요약</h3>
        {monthlySummary.count > 0 ? (
          <>
            {/* 격려 문구 (상단 표시) */}
            {monthlySummary.encouragementMessage && (
              <p className="summary-encouragement">
                {monthlySummary.encouragementMessage}
              </p>
            )}
            <p className="summary-main">
              이번 달에는 <strong>{monthlySummary.count}</strong>일 동안 상태를 기록했고,
              <br />
              평균 별점은 <strong>{monthlySummary.average}</strong>점이에요.
            </p>
            {monthlySummary.exercises.length > 0 && (
              <div className="exercise-summary">
                <table className="exercise-summary-table">
                  <tbody>
                    {monthlySummary.exercises.map((ex) => (
                      <tr key={ex.name}>
                        <td className="exercise-name-cell">{ex.name}</td>
                        <td className="exercise-time-cell">
                          {ex.hours > 0 ? `${ex.hours}시간 ` : ''}
                          {ex.minutes > 0 ? `${ex.minutes}분` : ex.hours === 0 ? '0분' : ''}
                        </td>
                        <td className="exercise-label-cell">했어요.</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <p className="summary-empty">아직 이번 달 기록이 없어요.</p>
        )}
      </div>

      {/* 가족 선택 드로어 */}
      {isDrawerOpen && (
        <>
          <div className="drawer-overlay" onClick={handleCloseDrawer}></div>
          <div className="family-drawer">
            <div className="drawer-header">
              <h2>가족 선택</h2>
              <button className="drawer-close-button" onClick={handleCloseDrawer} aria-label="닫기">
                ×
              </button>
            </div>
            <div className="drawer-content">
              {familyMembers.length === 0 ? (
                <div className="drawer-empty">
                  <p>등록된 가족 구성원이 없습니다.</p>
                </div>
              ) : (
                <div className="drawer-member-list">
                  {familyMembers.map((member) => {
                    const isSelected = member.id === parseInt(memberId)
                    return (
                      <div
                        key={member.id}
                        className={`drawer-member-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleSelectFamilyMember(member.id)}
                      >
                        <div className="drawer-member-avatar">
                          {member.avatar ? (
                            <img src={member.avatar} alt={member.name} />
                          ) : (
                            <span className="drawer-avatar-placeholder">
                              {member.name?.[0] ?? '?'}
                            </span>
                          )}
                        </div>
                        <div className="drawer-member-name">{member.name}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Calendar
