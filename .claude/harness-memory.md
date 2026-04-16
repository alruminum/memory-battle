# Harness Memory

## Known Failure Patterns

- 2026-04-02 | Epic-09 combo-timer | SPEC_GAP | "타이머 바 UI 제거" 지시를 "타이머 로직 전체 제거"로 해석. getInputTimeout + useTimer 삭제됨.
  → impl 파일에 "UI 제거 / 로직 유지" 명시 필수. "제거"라는 단어 단독 사용 금지. (cb13448)

- 2026-04-03 | Epic-10 overlay | tap-through | onPointerDown으로 버튼 입력 → gameOver → 오버레이 렌더 후 pointerup 시 click 이벤트가 오버레이로 전달되어 즉시 닫힘.
  → 오버레이 인터랙션은 항상 onPointerDown. onClick 사용 금지. (142ceac)

- 2026-04-01 | Epic-02 ranking | race-condition | isNewBest 판정 전에 fetchAll 미완료 → 잘못된 순위 표시.
  → useRanking 마운트 시 fetchAll 선행 보장 필수. (55242ec)

- 2026-03-31 | game-engine | race-condition | setCountdown(3) 이후 React 리렌더링 전 두 번째 클릭 → countdown이 null이라 startGame 중복 실행.
  → 즉시 잠금이 필요한 상태는 ref로 관리. state만으로 guard 불충분. (9035edb)

## Success Patterns

- 2026-04-03 | Epic-10 overlay | onPointerDown 통일로 탭-쓰루 완전 차단. 오버레이 계열 컴포넌트 전체 적용 권장.

- 2026-04-03 | Epic-09 score-multiplier | addInput 배율 즉시 적용 + stageClear clearBonus 전용 분리. impl 의사코드가 정확해 1회차에 PASS. 점수 계산 로직 변경 시 prevAccumulated 재계산 패턴 제거 + 단계별 누적 방식이 더 단순하고 버그 적음.

- 2026-04-05 | 01-countdown-hint | success | attempt 1. 로컬 useState+useEffect 750ms 타이머 패턴. countdown null→숫자 전환만 감지하는 의존성 패턴([countdown===null?null:'active'])이 깔끔. key={countdown} 재마운트 flipIn도 정상. (390a583)
- 2026-04-07 | 09-multiplier-burst-enhance | validator_fail | ```
- 2026-04-07 | 10-floating-score | validator_fail |    - 현상: `ButtonPad onPress`로 전달되는 함수 참조가 매 렌더마다 교체
- 2026-04-08 | 03-color-scheme-fix | autocheck_fail | no_changes: engineer가 아무 파일도 수정하지 않음
- 2026-04-09 | 16-combo-timer-gauge | test_fail | 
- 2026-04-09 | 17-block-pop-animation | success | attempt 1

## impl 패턴

## design 패턴

## bugfix 패턴
- 2026-04-11 | 18-combo-timer-color-shake | success | attempt 1
- 2026-04-11 | 99-combo-timer-shake-fix | validator_fail | validator FAIL (see /Users/dc.kim/project/memoryBattle/.claude/harness-state/mb_history/impl/attempt
- 2026-04-11 | 99-combo-timer-shake-fix | success | attempt 2
- 2026-04-11 | #100-visibility-timer-fix | validator_fail | validator agent produced no output (exit=142)
- 2026-04-11 | #100-visibility-timer-fix | success | attempt 2
- 2026-04-11 | #101-result-friend-ranking-removal | success | attempt 1
- 2026-04-11 | #102-result-ad-placeholder-monthly-removal | success | attempt 1
- 2026-04-11 | #103-gameover-basescore-fix | success | attempt 1
- 2026-04-14 | #104-ranking-back-fix | success | attempt 1
- 2026-04-14 | #104-ranking-back-fix | success | attempt 1
- 2026-04-15 | dead-code-removal | pr_fail | pr-reviewer CHANGES_REQUESTED (see /Users/dc.kim/project/memoryBattle/.claude/harness-state/mb_histo
- 2026-04-15 | doc-drift-fix | autocheck_fail | new_deps: package.json에 새 의존성이 추가됨 (사전 승인 필요)
- 2026-04-15 | #105-safe-area-fix | success | attempt 1
- 2026-04-15 | #106-result-combo-text-fix | pr_fail | pr-reviewer CHANGES_REQUESTED (see /Users/dc.kim/project/memoryBattle/.claude/harness-state/mb_histo
- 2026-04-15 | #106-result-combo-text-fix | success | attempt 2
- 2026-04-15 | #106-result-combo-text-fix | success | attempt 1
- 2026-04-15 | #106-result-combo-text-fix | success | attempt 1
- 2026-04-16 | 02-daily-reward-removal | success | attempt 1
- 2026-04-16 | 03-ad-coin-reward | autocheck_fail | no_changes: engineer가 아무 파일도 수정하지 않음
- 2026-04-16 | 03-ad-coin-reward | pr_fail | pr-reviewer CHANGES_REQUESTED (see /Users/dc.kim/project/memoryBattle/.claude/harness-state/mb_histo
