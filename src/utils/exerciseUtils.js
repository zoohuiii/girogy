// 운동 목록 관리 유틸 함수

const EXERCISES_KEY = 'girogy_exercises'

// 초기 운동 목록
const INITIAL_EXERCISES = ['걷기', '스트레칭', '근력', '유산소', '요가', '재활']

/**
 * 운동 목록 불러오기
 * @returns {string[]} 운동 목록
 */
export const getExercises = () => {
  try {
    const saved = localStorage.getItem(EXERCISES_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
    // 저장된 값이 없으면 초기값 저장 후 반환
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(INITIAL_EXERCISES))
    return INITIAL_EXERCISES
  } catch (e) {
    console.error('운동 목록 불러오기 실패:', e)
    return INITIAL_EXERCISES
  }
}

/**
 * 운동 목록 저장
 * @param {string[]} exercises - 저장할 운동 목록
 * @returns {boolean} 성공 여부
 */
export const saveExercises = (exercises) => {
  try {
    localStorage.setItem(EXERCISES_KEY, JSON.stringify(exercises))
    return true
  } catch (e) {
    console.error('운동 목록 저장 실패:', e)
    return false
  }
}

/**
 * 운동 추가
 * @param {string} exerciseName - 추가할 운동 이름
 * @returns {boolean} 성공 여부
 */
export const addExercise = (exerciseName) => {
  if (!exerciseName || !exerciseName.trim()) {
    return false
  }

  const exercises = getExercises()
  const trimmedName = exerciseName.trim()

  // 중복 체크
  if (exercises.includes(trimmedName)) {
    return false
  }

  try {
    const updated = [...exercises, trimmedName]
    saveExercises(updated)
    return true
  } catch (e) {
    console.error('운동 추가 실패:', e)
    return false
  }
}

/**
 * 운동 수정
 * @param {string} oldName - 수정할 운동 이름
 * @param {string} newName - 새로운 운동 이름
 * @returns {boolean} 성공 여부
 */
export const updateExercise = (oldName, newName) => {
  if (!newName || !newName.trim()) {
    return false
  }

  const exercises = getExercises()
  const trimmedNewName = newName.trim()

  // 중복 체크
  if (exercises.includes(trimmedNewName) && trimmedNewName !== oldName) {
    return false
  }

  try {
    const updated = exercises.map(ex => ex === oldName ? trimmedNewName : ex)
    saveExercises(updated)
    return true
  } catch (e) {
    console.error('운동 수정 실패:', e)
    return false
  }
}

/**
 * 운동 삭제
 * @param {string} exerciseName - 삭제할 운동 이름
 * @returns {boolean} 성공 여부
 */
export const removeExercise = (exerciseName) => {
  const exercises = getExercises()
  const filtered = exercises.filter((name) => name !== exerciseName)

  try {
    saveExercises(filtered)
    return true
  } catch (e) {
    console.error('운동 삭제 실패:', e)
    return false
  }
}

// 레거시 호환: 기존 함수들도 유지 (하위 호환성)
export const getDefaultExercises = getExercises
export const getCustomExercises = () => []
export const addCustomExercise = addExercise
export const updateDefaultExercise = updateExercise
export const updateCustomExercise = updateExercise
export const removeCustomExercise = removeExercise
