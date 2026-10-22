/** 물리 튜닝 상수. 디버그 패널이 런타임에 바꾼다. 제약 관련 값은 월드를 새로 만들 때 적용된다 */
export const PARAMS = {
  /** 이웃 블록 사이 스프링 강성 (0~1) */
  stiffness: 0.08,
  /** 가장자리 블록을 프레임에 붙드는 스프링 강성 */
  anchor: 0.08,
  /** 스프링 감쇠 */
  damping: 0.05,
  /** 공기 저항. 흔들림이 잦아드는 속도 */
  frictionAir: 0.08,
  /** 스프링이 이만큼(px) 늘거나 줄면 끊긴다 */
  breakStretch: 8,
  /** 타격 시 이웃 블록에 주는 속도 (px/step) */
  impulse: 14,
  /** 난수 폭. 세기 ±spread, 방향 ±spread/2 rad */
  spread: 0.4,
  /** 타격 후 시뮬레이션 스텝 수 (60Hz) */
  steps: 90,
}
