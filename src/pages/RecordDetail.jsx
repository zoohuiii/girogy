import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import '../styles/RecordDetail.css'
import { getExercises } from '../utils/exerciseUtils'

function RecordDetail() {
  const { memberId, date } = useParams()
  const navigate = useNavigate()
  
  // 필드 상태
  const [note, setNote] = useState('')
  // 운동 기록: 여러 개의 운동 행을 관리 [{ id, type, minutes }]
  const [exerciseRows, setExerciseRows] = useState([
    { id: 1, type: '', minutes: 0 },
  ])
  const [emotion, setEmotion] = useState('')
  const [rating, setRating] = useState(0)
  const [medicineTaken, setMedicineTaken] = useState(false)
  const [medicineNote, setMedicineNote] = useState('')
  const [notes, setNotes] = useState('')
  
  const [memberName, setMemberName] = useState('')
  const [memberAge, setMemberAge] = useState(null)
  const [memberDiseases, setMemberDiseases] = useState([])
  const [hasRecord, setHasRecord] = useState(false)
  const [exercises, setExercises] = useState([])

  // 운동 목록 불러오기 (안전하게)
  useEffect(() => {
    try {
      const exerciseList = getExercises()
      setExercises(Array.isArray(exerciseList) ? exerciseList : [])
    } catch (e) {
      console.error('운동 목록 불러오기 실패:', e)
      setExercises([])
    }
  }, [])

  useEffect(() => {
    // 로컬 스토리지에서 구성원 정보 가져오기
    const savedMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]')
    const member = savedMembers.find(m => m.id === parseInt(memberId))
    setMemberName(member?.name || '구성원')
    setMemberAge(member?.age || null)
    // conditions 우선 사용, 없으면 diseases 사용 (호환성)
    const memberConditions = member?.conditions || (member?.diseases ? member.diseases.map(d => ({
      name: d.name || ''
    })) : [])
    setMemberDiseases(memberConditions)

    // 로컬 스토리지에서 기록 가져오기 (memberId_date 형식)
    const recordKey = `${memberId}_${date}`
    const savedRecord = localStorage.getItem(recordKey)
    if (savedRecord) {
      try {
        const record = JSON.parse(savedRecord)
        setHasRecord(true)
        setNote(record.note || '')
        
        // 운동 시간 로드: 새 구조(exercises 배열) 또는 레거시(exercise 객체/배열)
        const rows = []
        if (record.exercises && Array.isArray(record.exercises) && record.exercises.length > 0) {
          record.exercises.forEach((ex, idx) => {
            if (ex && ex.type) {
              const minutes = ex.duration ? parseInt(ex.duration) || 0 : 0
              rows.push({
                id: idx + 1,
                type: ex.type,
                minutes,
              })
            }
          })
        } else if (record.exercise && record.exercise.type) {
          const minutes = record.exercise.duration ? parseInt(record.exercise.duration) || 0 : 0
          rows.push({
            id: 1,
            type: record.exercise.type,
            minutes,
          })
        } else if (record.exercises && record.exercises.length > 0) {
          // 가장 오래된 레거시: exercises 배열(문자열 또는 객체)
          record.exercises.forEach((ex, idx) => {
            if (typeof ex === 'string') {
              rows.push({
                id: idx + 1,
                type: ex,
                minutes: 0,
              })
            } else if (ex && ex.type) {
              const minutes = ex.duration ? parseInt(ex.duration) || 0 : 0
              rows.push({
                id: idx + 1,
                type: ex.type,
                minutes,
              })
            }
          })
        }

        // 최소 1개의 빈 행은 유지
        if (rows.length === 0) {
          rows.push({ id: 1, type: '', minutes: 0 })
        }
        setExerciseRows(rows)
        
        setEmotion(record.emotion || '')
        setRating(record.rating || 0)
        setMedicineTaken(record.medicineTaken || false)
        setMedicineNote(record.medicineNote || '')
        setNotes(record.notes || '')
      } catch (e) {
        // 파싱 오류 무시
      }
    } else {
      setHasRecord(false)
      // 새 기록일 경우 기본 한 행만 유지
      setExerciseRows([{ id: 1, type: '', minutes: 0 }])
    }
  }, [memberId, date])

  // 운동 선택 핸들러 (행별)
  const handleExerciseSelect = (rowId, value) => {
    setExerciseRows(prev =>
      prev.map(row =>
        row.id === rowId ? { ...row, type: value || '' } : row,
      ),
    )
  }

  // 시간/분 분리 계산 함수
  const getHours = (minutes) => {
    return Math.floor((minutes || 0) / 60)
  }

  const getMinutes = (minutes) => {
    const remainder = (minutes || 0) % 60
    // 5분 단위로 반올림 (0, 5, 10, 15, ..., 55)
    return Math.floor(remainder / 5) * 5
  }

  // 시간 토글 (1시간 단위, 행별)
  const handleHourIncrement = (rowId) => {
    setExerciseRows(prev =>
      prev.map(row => {
        if (row.id !== rowId || !row.type) return row
        const currentHours = getHours(row.minutes)
        const currentMinutes = getMinutes(row.minutes)
        const nextHours = currentHours + 1
        const totalMinutes = nextHours * 60 + currentMinutes
        const safeMinutes = Math.min(totalMinutes, 23 * 60 + 55)
        return { ...row, minutes: safeMinutes }
      }),
    )
  }

  const handleHourDecrement = (rowId) => {
    setExerciseRows(prev =>
      prev.map(row => {
        if (row.id !== rowId || !row.type) return row
        const currentHours = getHours(row.minutes)
        const currentMinutes = getMinutes(row.minutes)
        if (currentHours === 0) return row
        const nextHours = currentHours - 1
        return { ...row, minutes: nextHours * 60 + currentMinutes }
      }),
    )
  }

  // 분 토글 (5분 단위, 행별)
  const handleMinuteIncrement = (rowId) => {
    setExerciseRows(prev =>
      prev.map(row => {
        if (row.id !== rowId || !row.type) return row
        const currentHours = getHours(row.minutes)
        const currentMinutes = getMinutes(row.minutes)
        let nextMinutes = currentMinutes + 5
        if (nextMinutes > 55) {
          if (currentHours >= 23) return row
          return { ...row, minutes: (currentHours + 1) * 60 }
        }
        return { ...row, minutes: currentHours * 60 + nextMinutes }
      }),
    )
  }

  const handleMinuteDecrement = (rowId) => {
    setExerciseRows(prev =>
      prev.map(row => {
        if (row.id !== rowId || !row.type) return row
        const currentHours = getHours(row.minutes)
        const currentMinutes = getMinutes(row.minutes)
        if (currentHours === 0 && currentMinutes === 0) return row
        if (currentMinutes === 0) {
          if (currentHours === 0) return row
          return { ...row, minutes: (currentHours - 1) * 60 + 55 }
        }
        const nextMinutes = currentMinutes - 5
        return { ...row, minutes: currentHours * 60 + nextMinutes }
      }),
    )
  }

  // 운동 행 추가
  const handleAddExerciseRow = () => {
    setExerciseRows(prev => [
      ...prev,
      { id: Date.now(), type: '', minutes: 0 },
    ])
  }

  // 드롭다운 포커스 (운동 선택 도우미)
  const handleFocusExerciseSelect = () => {
    const select = document.querySelector('.exercise-select')
    if (select) {
      select.focus()
    }
  }

  const handleSave = () => {
    const recordKey = `${memberId}_${date}`
    // 운동 배열 생성 (type이 있고, 시간 > 0 인 것만)
    const validExercises = exerciseRows
      .filter(row => row.type && row.minutes > 0)
      .map(row => ({
        type: row.type,
        duration: row.minutes,
      }))

    const mainExercise = validExercises.length > 0 ? validExercises[0] : null

    const record = {
      note: note,
      // 레거시 호환을 위해 첫 번째 운동은 exercise 필드에도 저장
      exercise: mainExercise,
      exercises: validExercises,
      emotion: emotion,
      rating: rating,
      medicineTaken: medicineTaken,
      medicineNote: medicineNote,
      notes: notes,
      date: date,
      memberId: memberId,
    }
    localStorage.setItem(recordKey, JSON.stringify(record))
    navigate(`/calendar/${memberId}`)
  }

  const handleDelete = () => {
    if (window.confirm('이 기록을 삭제하시겠습니까?')) {
      const recordKey = `${memberId}_${date}`
      localStorage.removeItem(recordKey)
      navigate(`/calendar/${memberId}`)
    }
  }

  const handleBack = () => {
    navigate(`/calendar/${memberId}`)
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
  }


  return (
    <div className="record-detail">
      <div className="record-header">
        <button className="back-button" onClick={handleBack}>←</button>
        <div className="member-info-header">
          <h1>{memberName}{memberAge ? ` (${memberAge}세)` : ''}</h1>
          {memberDiseases.length > 0 && (
            <div className="member-diseases">
              {memberDiseases.map((disease, idx) => (
                <span key={idx} className="disease-tag">
                  {disease.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="record-title-section">
        <h2 className="record-title">오늘의 상태 기록</h2>
        <div className="record-date">{formatDate(date)}</div>
        {!hasRecord && (
          <div className="empty-record-message">
            기록이 필요한 날! 기로기를 핑계로 가족과 대화를 해봅시다 :&gt;
          </div>
        )}
      </div>
      
      <div className="record-form">
        {/* 한 줄 기록 */}
        <div className="form-card">
          <label className="form-label">한 줄 기록</label>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="간단한 기록을 입력하세요"
            className="form-input"
          />
        </div>

        {/* 운동 기록 */}
        <div className="form-card">
          <label className="form-label">운동 기록</label>
          <div className="exercise-rows">
            {exerciseRows.map((row) => (
              <div key={row.id} className="compact-exercise-row">
                <select
                  className="exercise-select"
                  value={row.type}
                  onChange={(e) => handleExerciseSelect(row.id, e.target.value)}
                >
                  <option value="">운동 선택</option>
                  {exercises.map((exerciseName) => (
                    <option key={exerciseName} value={exerciseName}>
                      {exerciseName}
                    </option>
                  ))}
                </select>

                {/* 시간 토글 */}
                <div className="time-toggle-group">
                  <span className="time-label">시간</span>
                  <div className="time-toggle-controls">
                    <button
                      type="button"
                      className="time-toggle-button minus"
                      onClick={() => handleHourDecrement(row.id)}
                      disabled={!row.type || getHours(row.minutes) === 0}
                    >
                      −
                    </button>
                    <span className="time-display-value">
                      {getHours(row.minutes)}
                    </span>
                    <button
                      type="button"
                      className="time-toggle-button plus"
                      onClick={() => handleHourIncrement(row.id)}
                      disabled={!row.type || getHours(row.minutes) >= 23}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* 분 토글 */}
                <div className="time-toggle-group">
                  <span className="time-label">분</span>
                  <div className="time-toggle-controls">
                    <button
                      type="button"
                      className="time-toggle-button minus"
                      onClick={() => handleMinuteDecrement(row.id)}
                      disabled={!row.type || row.minutes === 0}
                    >
                      −
                    </button>
                    <span className="time-display-value">
                      {getMinutes(row.minutes)}
                    </span>
                    <button
                      type="button"
                      className="time-toggle-button plus"
                      onClick={() => handleMinuteIncrement(row.id)}
                      disabled={!row.type || getMinutes(row.minutes) >= 55}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 운동 행 추가 버튼 */}
          <button
            type="button"
            className="exercise-select-helper-button"
            onClick={handleAddExerciseRow}
          >
            + 운동 추가
          </button>
        </div>

        {/* 감정 기록 */}
        <div className="form-card">
          <label className="form-label">감정 기록</label>
          <div className="emotion-buttons">
            {['좋음', '보통', '나쁨'].map((em) => (
              <button
                key={em}
                type="button"
                className={`emotion-button ${emotion === em ? 'active' : ''}`}
                onClick={() => setEmotion(em)}
              >
                {em}
              </button>
            ))}
          </div>
        </div>

        {/* 상태 기록 */}
        <div className="form-card">
          <label className="form-label">상태 기록</label>
          <div className="rating-group">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={`star-button ${rating >= star ? 'active' : ''}`}
                onClick={() => setRating(star)}
              >
                ★
              </button>
            ))}
            {rating > 0 && (
              <span className="rating-text">{rating}점</span>
            )}
          </div>
        </div>

        {/* 약 복용 */}
        <div className="form-card">
          <label className="form-label">약 복용</label>
          <div className="medicine-section">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={medicineTaken}
                onChange={(e) => setMedicineTaken(e.target.checked)}
                className="toggle-checkbox"
              />
              <span className="toggle-switch"></span>
              <span className="toggle-text">복용 완료</span>
            </label>
            {medicineTaken && (
              <input
                type="text"
                value={medicineNote}
                onChange={(e) => setMedicineNote(e.target.value)}
                placeholder="약 복용 관련 메모 (선택사항)"
                className="form-input medicine-note"
              />
            )}
          </div>
        </div>

        {/* 특이사항 */}
        <div className="form-card">
          <label className="form-label">특이사항</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="특이사항을 입력하세요..."
            rows={4}
            className="form-textarea"
          />
        </div>
      </div>

      <div className="button-group">
        <button className="save-button" onClick={handleSave}>
          {hasRecord ? '수정' : '저장'}
        </button>
        {hasRecord && (
          <button className="delete-button" onClick={handleDelete}>
            삭제
          </button>
        )}
      </div>

    </div>
  )
}

export default RecordDetail
