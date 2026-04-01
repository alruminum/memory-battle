/** 게임 로직 순수 함수 모듈 */

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
