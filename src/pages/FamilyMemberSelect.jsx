import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/FamilyMemberSelect.css'

function FamilyMemberSelect() {
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('familyMembers')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        // 예전 형식으로 저장된 데이터가 있어도 새 구조로 맞춰서 사용
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
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newMemberName, setNewMemberName] = useState('')
  const [relation, setRelation] = useState('나')
  const [customRelation, setCustomRelation] = useState('')
  const [avatarData, setAvatarData] = useState(null)
  const [memberAge, setMemberAge] = useState('')
  const [diseases, setDiseases] = useState([{ name: '' }])
  const navigate = useNavigate()

  const handleSelectMember = (memberId) => {
    // 오늘 날짜를 YYYY-MM-DD 형식으로 생성
    const today = new Date()
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    navigate(`/record/${memberId}/${todayStr}`)
  }

  const handleOpenAddModal = () => {
    setNewMemberName('')
    setRelation('나')
    setCustomRelation('')
    setAvatarData(null)
    setMemberAge('')
    setDiseases([{ name: '' }])
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setNewMemberName('')
    setRelation('나')
    setCustomRelation('')
    setAvatarData(null)
    setMemberAge('')
    setDiseases([{ name: '' }])
  }

  const handleAddDisease = () => {
    setDiseases([...diseases, { name: '' }])
  }

  const handleRemoveDisease = (index) => {
    if (diseases.length > 1) {
      setDiseases(diseases.filter((_, i) => i !== index))
    }
  }

  const handleDiseaseChange = (index, field, value) => {
    const updated = [...diseases]
    updated[index] = { ...updated[index], [field]: value }
    setDiseases(updated)
  }

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarData(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveMember = () => {
    if (!newMemberName.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    const relationText =
      relation === '기타'
        ? (customRelation || '기타')
        : relation

    const filteredDiseases = diseases
      .filter(d => d.name.trim())
      .map(d => ({
        name: d.name.trim(),
      }))

    const newMember = {
      id: Date.now(),
      name: newMemberName.trim(),
      relation: relationText,
      avatar: avatarData || null,
      age: memberAge ? parseInt(memberAge) : null,
      diseases: filteredDiseases,
    }
    const updatedMembers = [...members, newMember]

    setMembers(updatedMembers)
    localStorage.setItem('familyMembers', JSON.stringify(updatedMembers))
    handleCloseModal()
  }


  return (
    <div className="family-member-select">
      <header className="family-header">
        <div className="header-content">
          <div>
            <h1>가족 건강 기록</h1>
            <p className="family-subtitle">기록을 남길 가족을 선택하세요</p>
          </div>
          <button
            className="add-member-icon-button"
            onClick={handleOpenAddModal}
            aria-label="인물 추가"
          >
            +
          </button>
        </div>
      </header>

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

      {isModalOpen && (
        <div className="member-modal-overlay" onClick={handleCloseModal}>
          <div
            className="member-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>인물 추가</h2>

            <div className="modal-form">
              <div className="modal-field">
                <label>이름 *</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(event) => setNewMemberName(event.target.value)}
                  placeholder="이름을 입력하세요"
                />
              </div>

              <div className="modal-field">
                <label>관계</label>
                <div className="relation-select-row">
                  <select
                    value={relation}
                    onChange={(event) => setRelation(event.target.value)}
                  >
                    <option value="나">나</option>
                    <option value="아빠">아빠</option>
                    <option value="엄마">엄마</option>
                    <option value="할아버지">할아버지</option>
                    <option value="할머니">할머니</option>
                    <option value="기타">기타</option>
                  </select>
                  {relation === '기타' && (
                    <input
                      type="text"
                      value={customRelation}
                      onChange={(event) => setCustomRelation(event.target.value)}
                      placeholder="직접 입력"
                    />
                  )}
                </div>
              </div>

              <div className="modal-field">
                <label>나이</label>
                <input
                  type="number"
                  value={memberAge}
                  onChange={(event) => setMemberAge(event.target.value)}
                  placeholder="나이를 입력하세요 (선택사항)"
                  min="0"
                  max="150"
                />
              </div>

              <div className="modal-field">
                <label>질환 정보 (선택사항)</label>
                {diseases.map((disease, index) => (
                  <div key={index} className="disease-input-row">
                    <input
                      type="text"
                      value={disease.name}
                      onChange={(e) => handleDiseaseChange(index, 'name', e.target.value)}
                      placeholder="질환명 (예: 파킨슨병)"
                      className="disease-name-input"
                    />
                    {diseases.length > 1 && (
                      <button
                        type="button"
                        className="remove-disease-button"
                        onClick={() => handleRemoveDisease(index)}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="add-disease-button"
                  onClick={handleAddDisease}
                >
                  + 질환 추가
                </button>
              </div>

              <div className="modal-field">
                <label>이미지 아바타</label>
                <div className="avatar-upload-row">
                  <div className="member-avatar preview">
                    {avatarData ? (
                      <img src={avatarData} alt="새 아바타 미리보기" />
                    ) : (
                      <span className="avatar-placeholder">
                        {newMemberName?.[0] ?? '?'}
                      </span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                  />
                </div>
              </div>
            </div>

            <div className="modal-buttons">
              <button className="modal-cancel" onClick={handleCloseModal}>
                취소
              </button>
              <button className="modal-save" onClick={handleSaveMember}>
                저장
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FamilyMemberSelect
