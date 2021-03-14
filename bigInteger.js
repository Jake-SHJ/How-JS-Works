// Number.MAX_SAFE_INTEGER = 9007199254740991 (최대 16자리 정수)
// int64형은 최대 9223372036854775807 (19자리 정수)

// 라이브러리 형태로 구축
// 큰 정수를 배열의 형태로 저장
// 배열의 각 요소는 큰 정수의 일부 비트에 해당하는 값
// 배열의 각 요소는 가장 큰 값이 53비트이므로, 곱하기 / 나누기를 고려했을 때 53의 절반 이하가 적정 => 24비트로 결정 (디지트 단위의 백만배 이상을 표현 =>  '메가디지트'로 명명)
// 배열의 0번은 부호, 첫번째 요소는 숫자의 최하위 메가디지트, 마지막 요소은 최상위 유효 숫자 메가디지트
// 9000000000000000000 = ["+", 8650752, 7098594, 31974] = 8650752 + 709854 * 16777216 ** 1 + 31974 * 16777216 ** 2 = 8650752 + ((709854 + (31974 * 16777216)) * 16777216)

// 찾아보니 bigInt가 내장 객체로 추가된 것이 ECMA 262 명세에 포함되어 있다. 크로스 브라우징 중

// 상수 정의
const radix = 16777216;
const radix_squared = radix * radix;
const log2_radix = 24;
const plus = "+";
const minus = "-";
const sign = 0;
const least = 1;

// 마지막 요소
function last(array) {
  return array[array.length - 1];
}

// 마지막 이전 요소
function next_to_last(array) {
  return array[array.length - 2];
}

// 상수 정의
const zero = Object.freeze([plus]);
const wun = Object.freeze([plus, 1]);
const two = Object.freeze([plus, 2]);
const ten = Object.freeze([plus, 10]);
const negative_wun = Object.freeze([minus, 1]);

// 큰 정수인지 확인
function is_big_integer(big) {
  return Array.isArray(big) && (big[sign] === plus || big[sign] === minus);
}

// 부호 확인
function is_negative(big) {
  return Array.isArray(big) && big[sign] === minus;
}

function is_positive(big) {
  return Array.isArray(big) && big[sign] === plus;
}

function is_zero(big) {
  return !Array.isArray(big) || big.length < 2;
}

// 배열의 마지막 요소가 0인 경우 제거, 상수 중 일치하는 값이 있다면 상수로 전환, 바꿀 것이 없다면 배열 동결
function mint(proto_big_integer) {
  while (last(proto_big_integer) === 0) {
    proto_big_integer.length -= 1;
  }
  if (proto_big_integer.length <= 1) {
    return zero;
  }
  if (proto_big_integer[sign] === plus) {
    if (proto_big_integer.length === 2) {
      if (proto_big_integer[least] === 1) {
        return wun;
      }
      if (proto_big_integer[least] === 2) {
        return two;
      }
      if (proto_big_integer[least] === 10) {
        return ten;
      }
    }
  } else if (proto_big_integer.length === 2) {
    if (proto_big_integer[least] === 1) {
      return negative_wun;
    }
  }
  return Object.freeze(proto_big_integer);
}

// 부호 변경
function neg(big) {
  if (is_zero) {
    return zero;
  }
  let negation = big.slice();
  negation[sign] = is_negative(big) ? plus : minus;
  return mint(negation);
}

// 절댓값
function abs(big) {
  return is_zero(big) ? zero : is_negative(big) ? neg(big) : big;
}

// 부호 추출
function signum(big) {
  return is_zero(big) ? zero : is_negative(big) ? negative_wun : wun;
}

// 동일 값 판별
function eq(comparehend, comparator) {
  return (
    comparehend === comparator ||
    (comparehend.length === comparator.length &&
      comparehend.every(function (element, element_nr) {
        return element === comparator[element_nr];
      }))
  );
}
