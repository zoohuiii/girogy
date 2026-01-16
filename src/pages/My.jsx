import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/My.css'
import {
  getExercises,
  addExercise,
  updateExercise,
  removeExercise,
} from '../utils/exerciseUtils'

function My() {
  const navigate = useNavigate()
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
          age: m.age ?? null,
          conditions: m.conditions ?? (m.diseases ? m.diseases.map(d => ({
            name: d.name || ''
          })) : []),
        }))
      } catch (e) {
        // 파싱 실패 시 기본값 사용
      }
    }
    const defaultMembers = [
      { id: 1, name: '나', relation: '나', avatar: null, age: null, conditions: [] },
      { id: 2, name: '아빠', relation: '아빠', avatar: null, age: null, conditions: [] },
      { id: 3, name: '엄마', relation: '엄마', avatar: null, age: null, conditions: [] },
    ]
    localStorage.setItem('familyMembers', JSON.stringify(defaultMembers))
    return defaultMembers
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState(null)
  const [newMemberName, setNewMemberName] = useState('')
  const [relation, setRelation] = useState('나')
  const [customRelation, setCustomRelation] = useState('')
  const [avatarData, setAvatarData] = useState(null)
  const [memberAge, setMemberAge] = useState('')
  const [conditions, setConditions] = useState([{ name: '' }])
  const [draggedIndex, setDraggedIndex] = useState(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  // 운동 관리 상태
  const [exercises, setExercises] = useState([])
  const [editingExercise, setEditingExercise] = useState(null)
  const [editingExerciseName, setEditingExerciseName] = useState('')
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false)
  const [newExerciseName, setNewExerciseName] = useState('')


  const handleOpenAddModal = () => {
    setEditingMember(null)
    setNewMemberName('')
    setRelation('나')
    setCustomRelation('')
    setAvatarData(null)
    setMemberAge('')
    setConditions([{ name: '' }])
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (member) => {
    setEditingMember(member)
    setNewMemberName(member.name)
    setRelation(member.relation === '나' || member.relation === '아빠' || member.relation === '엄마' || member.relation === '할아버지' || member.relation === '할머니' ? member.relation : '기타')
    setCustomRelation(member.relation === '나' || member.relation === '아빠' || member.relation === '엄마' || member.relation === '할아버지' || member.relation === '할머니' ? '' : member.relation)
    setAvatarData(member.avatar)
    setMemberAge(member.age ? String(member.age) : '')
    // conditions 또는 diseases에서 가져오기 (호환성)
    const memberConditions = member.conditions || (member.diseases ? member.diseases.map(d => ({
      name: d.name || ''
    })) : [])
    setConditions(memberConditions.length > 0 ? memberConditions.map(c => ({ name: c.name })) : [{ name: '' }])
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingMember(null)
    setNewMemberName('')
    setRelation('나')
    setCustomRelation('')
    setAvatarData(null)
    setMemberAge('')
    setConditions([{ name: '' }])
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

  const handleAddCondition = () => {
    setConditions([...conditions, { name: '' }])
  }

  const handleRemoveCondition = (index) => {
    if (conditions.length > 1) {
      setConditions(conditions.filter((_, i) => i !== index))
    }
  }

  const handleConditionChange = (index, field, value) => {
    const updated = [...conditions]
    updated[index] = { ...updated[index], [field]: value }
    setConditions(updated)
  }

  const handleSaveMember = () => {
    if (!newMemberName.trim()) {
      alert('이름을 입력해주세요.')
      return
    }

    const relationText = relation === '기타' ? (customRelation || '기타') : relation

    // 질환명이 있는 것만 필터링하고 저장
    const filteredConditions = conditions
      .filter(c => c.name.trim())
      .map(c => ({
        name: c.name.trim(),
      }))

    const ageValue = memberAge.trim() ? parseInt(memberAge) : null

    let updatedMembers
    if (editingMember) {
      updatedMembers = members.map((m) =>
        m.id === editingMember.id
          ? {
              ...m,
              name: newMemberName.trim(),
              relation: relationText,
              avatar: avatarData || m.avatar || null,
              age: ageValue,
              conditions: filteredConditions,
            }
          : m
      )
    } else {
      const newMember = {
        id: Date.now(),
        name: newMemberName.trim(),
        relation: relationText,
        avatar: avatarData || null,
        age: ageValue,
        conditions: filteredConditions,
      }
      updatedMembers = [...members, newMember]
    }

    setMembers(updatedMembers)
    localStorage.setItem('familyMembers', JSON.stringify(updatedMembers))
    handleCloseModal()
  }

  const handleDeleteMember = (memberId) => {
    const target = members.find((m) => m.id === memberId)
    if (!target) return

    if (!window.confirm(`'${target.name}'을(를) 삭제하시겠습니까?`)) {
      return
    }

    const updatedMembers = members.filter((member) => member.id !== memberId)
    setMembers(updatedMembers)
    localStorage.setItem('familyMembers', JSON.stringify(updatedMembers))
  }

  // 드래그 앤 드롭 핸들러
  const handleDragStart = (event, index) => {
    setDraggedIndex(index)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/html', event.target)
  }

  const handleDragOver = (event, index) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDragLeave = () => {
    setDragOverIndex(null)
  }

  const handleDrop = (event, dropIndex) => {
    event.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null)
      setDragOverIndex(null)
      return
    }

    const newMembers = [...members]
    const draggedMember = newMembers[draggedIndex]
    
    // 드래그된 항목 제거
    newMembers.splice(draggedIndex, 1)
    // 새로운 위치에 삽입
    newMembers.splice(dropIndex, 0, draggedMember)
    
    setMembers(newMembers)
    localStorage.setItem('familyMembers', JSON.stringify(newMembers))
    
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
  }

  const handleGenerateInviteLink = () => {
    // 공동작업 기능은 나중에 구현
    alert('공동작업 기능은 준비 중입니다.')
  }

  // 운동 목록 불러오기
  useEffect(() => {
    setExercises(getExercises())
  }, [])

  // 운동 수정
  const handleEditExercise = (oldName) => {
    setEditingExercise(oldName)
    setEditingExerciseName(oldName)
    setIsExerciseModalOpen(true)
  }

  // 운동 추가 모달 열기
  const handleOpenAddExerciseModal = () => {
    setEditingExercise(null)
    setEditingExerciseName('')
    setNewExerciseName('')
    setIsExerciseModalOpen(true)
  }

  // 운동 목록 불러오기
  useEffect(() => {
    setExercises(getExercises())
  }, [])

  // 운동 모달 닫기
  const handleCloseExerciseModal = () => {
    setIsExerciseModalOpen(false)
    setEditingExercise(null)
    setEditingExerciseName('')
    setNewExerciseName('')
  }

  // 운동 저장 (추가/수정)
  const handleSaveExercise = () => {
    if (editingExercise) {
      // 수정
      if (!editingExerciseName.trim()) {
        alert('운동 이름을 입력해주세요.')
        return
      }

      if (updateExercise(editingExercise, editingExerciseName.trim())) {
        setExercises(getExercises())
        handleCloseExerciseModal()
      } else {
        alert('이미 존재하는 운동이거나 수정할 수 없습니다.')
      }
    } else {
      // 추가
      if (!newExerciseName.trim()) {
        alert('운동 이름을 입력해주세요.')
        return
      }

      if (addExercise(newExerciseName.trim())) {
        setExercises(getExercises())
        handleCloseExerciseModal()
      } else {
        alert('이미 존재하는 운동이거나 추가할 수 없습니다.')
      }
    }
  }

  // 운동 삭제
  const handleDeleteExercise = (exerciseName) => {
    if (window.confirm(`'${exerciseName}' 운동을 삭제하시겠습니까?`)) {
      if (removeExercise(exerciseName)) {
        setExercises(getExercises())
      }
    }
  }

  return (
    <div className="my-page page-with-tabbar">
      <div className="my-header">
        <h1>마이 페이지</h1>
        <p className="my-subtitle">설정</p>
      </div>

      {/* 가족 구성원 목록 */}
      <section className="my-section">
        <h2 className="section-title">가족 구성원</h2>
        <div className="member-list">
          {members.map((member, index) => (
            <div
              key={member.id}
              className={`member-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="member-avatar-small">
                {member.avatar ? (
                  <img src={member.avatar} alt={member.name} />
                ) : (
                  <span className="avatar-placeholder-small">
                    {member.name?.[0] ?? '?'}
                  </span>
                )}
              </div>
              <div className="member-info-small">
                <div className="member-name-small">{member.name}</div>
                <div className="member-relation-small">{member.relation}</div>
              </div>
              <div className="member-actions">
                <button
                  className="edit-button"
                  onClick={() => handleOpenEditModal(member)}
                  aria-label={`${member.name} 편집`}
                >
                  ✎
                </button>
                <button
                  className="delete-button-small"
                  onClick={() => handleDeleteMember(member.id)}
                  aria-label={`${member.name} 삭제`}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
        <button className="add-member-button-small" onClick={handleOpenAddModal}>
          + 구성원 추가
        </button>
      </section>

      {/* 운동 관리 섹션 */}
      <section className="my-section">
        <div className="section-header-with-button">
          <h2 className="section-title">운동 목록 관리</h2>
          <button className="add-exercise-button" onClick={handleOpenAddExerciseModal}>
            + 추가
          </button>
        </div>
        <p className="section-desc">운동 목록을 추가, 수정, 삭제할 수 있습니다.</p>
        
        <div className="exercise-management">
          {exercises.length === 0 ? (
            <p className="no-exercises">운동이 없습니다. 운동을 추가해주세요.</p>
          ) : (
            <div className="exercise-list">
              {exercises.map((exercise) => (
                <div key={exercise} className="exercise-item">
                  <span className="exercise-name">{exercise}</span>
                  <div className="exercise-actions">
                    <button
                      className="exercise-edit-button"
                      onClick={() => handleEditExercise(exercise)}
                      aria-label={`${exercise} 수정`}
                    >
                      ✎
                    </button>
                    <button
                      className="exercise-delete-button"
                      onClick={() => handleDeleteExercise(exercise)}
                      aria-label={`${exercise} 삭제`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 공동작업 섹션 */}
      <section className="my-section">
        <h2 className="section-title">공동작업</h2>
        <button className="invite-link-button" onClick={handleGenerateInviteLink}>
          초대 링크 생성
        </button>
        <p className="section-desc">가족과 함께 건강 기록을 공유해보세요</p>
      </section>

      {/* 앱 정보 */}
      <section className="my-section">
        <h2 className="section-title">앱 정보</h2>
        <div className="app-info">
          <div className="info-row">
            <span className="info-label">앱 이름</span>
            <span className="info-value">기로기</span>
          </div>
          <div className="info-row">
            <span className="info-label">버전</span>
            <span className="info-value">1.0.0</span>
          </div>
        </div>
      </section>

      {/* 모달 */}
      {isModalOpen && (
        <div className="member-modal-overlay" onClick={handleCloseModal}>
          <div
            className="member-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>{editingMember ? '인물 편집' : '인물 추가'}</h2>

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
                  step="1"
                />
              </div>

              <div className="modal-field">
                <label>이미지 아바타</label>
                <div className="avatar-upload-row">
                  <div className="member-avatar preview">
                    {avatarData ? (
                      <img src={avatarData} alt="아바타 미리보기" />
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

              <div className="modal-field">
                <label>질환 목록</label>
                <div className="conditions-list">
                  {conditions.map((condition, index) => (
                    <div key={index} className="condition-row">
                    <input
                      type="text"
                      value={condition.name}
                      onChange={(event) => handleConditionChange(index, 'name', event.target.value)}
                      placeholder="질환명"
                      className="condition-name-input"
                    />
                    {conditions.length > 1 && (
                        <button
                          type="button"
                          className="remove-condition-button"
                          onClick={() => handleRemoveCondition(index)}
                          aria-label="질환 삭제"
                        >
                          ×
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    className="add-condition-button"
                    onClick={handleAddCondition}
                  >
                    + 질환 추가
                  </button>
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

      {/* 운동 관리 모달 */}
      {isExerciseModalOpen && (
        <div className="member-modal-overlay" onClick={handleCloseExerciseModal}>
          <div
            className="member-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <h2>{editingExercise ? '운동 수정' : '운동 추가'}</h2>

            <div className="modal-form">
              <div className="modal-field">
                <label>운동 이름 *</label>
                <input
                  type="text"
                  value={editingExercise ? editingExerciseName : newExerciseName}
                  onChange={(event) =>
                    editingExercise
                      ? setEditingExerciseName(event.target.value)
                      : setNewExerciseName(event.target.value)
                  }
                  placeholder="운동 이름을 입력하세요"
                  onKeyPress={(e) => e.key === 'Enter' && handleSaveExercise()}
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-buttons">
              <button className="modal-cancel" onClick={handleCloseExerciseModal}>
                취소
              </button>
              <button className="modal-save" onClick={handleSaveExercise}>
                {editingExercise ? '수정' : '추가'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default My
