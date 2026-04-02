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
 * 스테이지 클리어 보너스 (10스테이지 이상부터 지급)
 */
export const calcClearBonus = (stage: number): number => {
  if (stage < 10) return 0
  return Math.floor(stage / 5)
}

/**
 * comboStreak -> 배율 (5연속마다 +1, 상한 없음)
 */
export const getComboMultiplier = (comboStreak: number): number =>
  Math.floor(comboStreak / 5) + 1

/**
 * 배율 미적용 스테이지 점수 (콤보 보너스 = score - baseScore)
 */
export const calcBaseStageScore = (stage: number): number => {
  return stage + calcClearBonus(stage)
}

/**
 * 스테이지 최종 점수
 * @param rawScore    버튼 점수 + 클리어 보너스 합산
 * @param comboStreak 배율 결정에 사용할 streak (클리어 직전 값)
 */
export const calcStageScore = (
  rawScore: number,
  comboStreak: number
): number => rawScore * getComboMultiplier(comboStreak)

/**
 * 스테이지에 따른 버튼 입력 제한 시간 (ms)
 * Stage 1~9: 2000ms / 10~19: 1800ms / 20~29: 1600ms / 30+: 1400ms
 *
 * 시퀀스 전체 제한이 아닌 버튼 1개 입력 간격 제한이다.
 * (시퀀스 길이와 무관하게 매 버튼마다 독립 적용)
 */
export const getInputTimeout = (stage: number): number => {
  if (stage >= 30) return 1400
  if (stage >= 20) return 1600
  if (stage >= 10) return 1800
  return 2000
}
