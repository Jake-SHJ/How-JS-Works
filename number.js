// 숫자를 구성 요소로 분해하는 함수
function deconstruct(number) {
  let sign = 1; // 부호
  let coefficient = number; // 계수
  let exponent = 0; // 지수

  number = sign * coefficient * 2 ** exponent; // js에서의 숫자의 형태

  // 계수에서 부호를 제거
  if (coefficient < 0) {
    coefficient = -coefficient;
    sign = -1;
  }

  if (Number.isFinite(number) && number !== 0) {
    // Infinity와 0을 제외
    exponent = -1128; // Number.MIN_VALUE의 지수 값에서 유효 숫자의 비트 개수 및 보너스 비트의 개수를 뺀 값
    let reduction = coefficient;
    while (reduction !== 0) {
      // 계수가 0이 될때 까지
      exponent += 1; // 나눌 때 마다 지수는 줄어든다.
      reduction /= 2; // 계수를 2로 나눈다.
    }

    reduction = exponent;
    // 지수가 0이 아니라면
    while (reduction > 0) {
      // 지수가 0보다 크면
      coefficient *= 2; // 계수를 바로 잡는다.
      reduction -= 1; // 지수를 줄인다.
    }
    while (reduction < 0) {
      // 지수가 0보다 작으면
      coefficient *= 2; // 계수를 바로 잡는다.
      reduction += 1; // 지수를 높인다.
    }
  }

  // 부호, 계수, 지수, 원래 숫자를 반환
  return {
    sign,
    coefficient,
    exponent,
    number,
  };
}

console.log("MAX_SAFE_INTEGER: ", deconstruct(Number.MAX_SAFE_INTEGER));
console.log("1: ", deconstruct(1));
console.log("0.1: ", deconstruct(0.1)); // { sign: 1, coefficient: 7205759403792794, exponent: -56, number: 0.1 } 지수, 계수를 넣어서 계산하면 0.1이 아니다.

console.log("0.1 + 0.2: ", deconstruct(0.1 + 0.2));
console.log("0.3: ", deconstruct(0.3)); // 둘 다 0.3이 아니다.

console.log("100 / 3: ", deconstruct(100 / 3)); // 33.333333333333336

// 10진 소수점 값을 신뢰할 수 없다.
