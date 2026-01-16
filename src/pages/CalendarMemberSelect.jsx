import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/FamilyMemberSelect.css'

function CalendarMemberSelect() {
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('familyMembers')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((m, index) => ({
          id: m.id ?? index + 1,
          name: m.name ?? '',
          relation: m.relation ?? (m.name === '나' ? '나' : m.name ?? '가족'),
          avatar: m.avatar ?? null,
        }))
      } catch (e) {
        // 파싱 실패 시 기본값 사용
      }
    }
    const defaultMembers = [
      { id: 1, name: '나', relation: '나', avatar: null },
      { id: 2, name: '아빠', relation: '아빠', avatar: null },
      { id: 3, name: '엄마', relation: '엄마', avatar: null },
    ]
    localStorage.setItem('familyMembers', JSON.stringify(defaultMembers))
    return defaultMembers
  })
  const navigate = useNavigate()

  const handleSelectMember = (memberId) => {
    navigate(`/calendar/${memberId}`)
  }

  return (
    <div className="family-member-select page-with-tabbar">
      <div className="member-select-header">
        <h1>가족 선택</h1>
        <p className="member-select-subtitle">달력을 보고 싶은 가족을 선택하세요</p>
      </div>

      <div className="member-grid">
        {members.map((member) => (
          <div
            key={member.id}
            className="member-card"
            onClick={() => handleSelectMember(member.id)}
          >
            <div className="member-avatar">
              {member.avatar ? (
                <img src={member.avatar} alt={member.name} />
              ) : (
                <span className="avatar-placeholder">
                  {member.name?.[0] ?? '?'}
                </span>
              )}
            </div>
            <div className="member-info">
              <div className="member-name">{member.name}</div>
              <div className="member-relation">{member.relation}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarMemberSelect
