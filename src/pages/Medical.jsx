import { useState, useEffect } from 'react'
import '../styles/Medical.css'

function Medical() {
  const [familyMembers, setFamilyMembers] = useState([])
  const [selectedMemberId, setSelectedMemberId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [records, setRecords] = useState({})

  // 가족 목록 불러오기
  useEffect(() => {
    const savedMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]')
    setFamilyMembers(savedMembers)
    // 첫 번째 가족을 기본 선택
    if (savedMembers.length > 0 && !selectedMemberId) {
      setSelectedMemberId(savedMembers[0].id)
    }
  }, [])

  // 선택된 가족의 기록 불러오기
  useEffect(() => {
    if (!selectedMemberId) return

    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth() + 1

    const allRecords = {}
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(`${selectedMemberId}_`)) {
        const dateStr = key.replace(`${selectedMemberId}_`, '')
        // YYYY-MM-DD 형식인지 확인
        const dateMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
        if (dateMatch) {
          const recordYear = parseInt(dateMatch[1])
          const recordMonth = parseInt(dateMatch[2])
          // 선택된 월의 기록만 필터링
          if (recordYear === year && recordMonth === month) {
            try {
              const record = JSON.parse(localStorage.getItem(key))
              if (record && record.note) {
                allRecords[dateStr] = record
              }
            } catch (e) {
              // 파싱 오류 무시
            }
          }
        }
      }
    }
    setRecords(allRecords)
  }, [selectedMemberId, selectedMonth])

  const selectedMember = familyMembers.find(m => m.id === selectedMemberId)

  // 월 선택 핸들러
  const handleMonthChange = (direction) => {
    const newDate = new Date(selectedMonth)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setSelectedMonth(newDate)
  }

  // 월 선택 모달 열기 (간단하게 이전/다음 버튼으로 대체 가능)
  const handleMonthClick = () => {
    // 월 선택 UI는 나중에 구현 가능
    // 지금은 이전/다음 버튼으로 처리
  }

  // 날짜별 기록 목록 생성
  const getRecordsList = () => {
    const year = selectedMonth.getFullYear()
    const month = selectedMonth.getMonth() + 1
    const daysInMonth = new Date(year, month, 0).getDate()
    
    const recordsList = []
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const record = records[dateStr]
      if (record && record.note) {
        recordsList.push({
          day,
          date: dateStr,
          note: record.note,
        })
      }
    }
    return recordsList
  }

  const recordsList = getRecordsList()
  const monthName = selectedMonth.getMonth() + 1

  return (
    <div className="medical-page page-with-tabbar">
      <div className="medical-header">
        <h1>기록톡</h1>
      </div>

      {/* 가족 구성원 탭 */}
      {familyMembers.length > 0 && (
        <div className="family-member-tabs">
          {familyMembers.map((member) => (
            <button
              key={member.id}
              type="button"
              className={`family-member-tab ${selectedMemberId === member.id ? 'active' : ''}`}
              onClick={() => setSelectedMemberId(member.id)}
            >
              {member.name}
            </button>
          ))}
        </div>
      )}

      {/* 선택된 가족의 기록 요약 */}
      {selectedMember && (
        <div className="record-summary-header">
          <p className="record-summary-text">
            {selectedMember.name} 님의 기록 AI요약으로 한 눈에 보기
          </p>
        </div>
      )}

      {/* 월 선택 */}
      <div className="month-selector">
        <button
          type="button"
          className="month-nav-button"
          onClick={() => handleMonthChange('prev')}
        >
          ◀
        </button>
        <button
          type="button"
          className="month-button"
          onClick={handleMonthClick}
        >
          {monthName}월
        </button>
        <button
          type="button"
          className="month-nav-button"
          onClick={() => handleMonthChange('next')}
        >
          ▶
        </button>
      </div>

      {/* 날짜별 기록 목록 */}
      <div className="records-list">
        {recordsList.length === 0 ? (
          <div className="no-records">
            <p>이번 달에는 기록이 없습니다.</p>
          </div>
        ) : (
          recordsList.map((item) => (
            <div key={item.date} className="record-item">
              <span className="record-day">{item.day}일</span>
              <span className="record-note">{item.note}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Medical
