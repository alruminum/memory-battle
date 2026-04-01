/** 게임 로직 순수 함수 모듈 */

/**
 * 스테이지에 따른 버튼 점등 시간 (ms)
 * Stage 1~9: 500ms / 10~19: 400ms / 20~29: 300ms / 30+: 250ms
 */
export const getFlashDuration = (stage: number): number => {
  if (stage >= 30) return 250
  if (stage >= 20) return 300
  if (stage >= 10) return 400
  return 500
}

/**
 * 스테이지에 따른 버튼 입력 제한 시간 (ms)
 * Stage 1~9: 2000ms / 10~19: 1800ms / 20~29: 1600ms / 30+: 1400ms
 */
export const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}

export const COMBO_ACTIVATION_STAGE = 5

/**
 * 스테이지 클리어 보너스 (10스테이지 이상부터 지급)
 */
export const calcClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}

/**
 * comboStreak -> 배율 (x1~x5)
 */
export const getComboMultiplier = (comboStreak: number): number =>
  Math.min(comboStreak + 1, 5)

/**
 * 배율 미적용 스테이지 점수 (콤보 보너스 = score - baseScore)
 */
export const calcBaseStageScore = (stage: number): number => {
  return stage + calcClearBonus(stage)
}

/**
 * 스테이지 최종 점수
 * @param buttonScore  해당 스테이지에서 버튼 입력으로 누적된 rawScore
 * @param comboStreak  현재 연속 풀콤보 스트릭 (배율 결정에 사용)
 * @param stage        클리어한 스테이지 번호
 * @param isFullCombo  해당 스테이지 풀콤보 여부
 */
export const calcStageScore = (
  buttonScore: number,
  comboStreak: number,
  stage: number,
  isFullCombo: boolean
): number => {
  const bonus = calcClearBonus(stage)
  const raw = buttonScore + bonus
  if (!isFullCombo || stage < COMBO_ACTIVATION_STAGE) return raw
  return raw * getComboMultiplier(comboStreak)
}
