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
function eq(comparahend, comparator) {
  return (
    comparahend === comparator ||
    (comparahend.length === comparator.length &&
      comparahend.every(function (element, element_nr) {
        return element === comparator[element_nr];
      }))
  );
}

// absolute less than, 절댓값이 다른 수의 절댓값보다 작은지 판별
function abs_lt(comparahend, comparator) {
  return comparahend.length === comparator.length // 동일한 개수의 메가디지트를 가지고 있다면
    ? comparahend.reduce(function (reduction, element, element_nr) {
        // 각 메가디지트 값을 비교
        if (element_nr !== sign) {
          const other = comparator[element_nr];
          if (element !== other) {
            return element < other;
          }
        }
        return reduction;
      }, false)
    : comparahend.length < comparator.length; // 더 많은 메가디지트를 가진 숫자가 더 큰 숫자
}

// less than
function lt(comparahend, comparator) {
  return comparahend[sign] !== comparator[sign]
    ? is_negative(comparahend)
    : is_negative(comparahend)
    ? abs_lt(comparator, comparahend)
    : abs_lt(comparahend, comparator);
}

// greater than or equal
function ge(a, b) {
  return !lt(a, b);
}

// greater than
function gt(a, b) {
  return lt(b, a);
}

// less than or equal
function le(a, b) {
  return !lt(b, a);
}

// 비트 연산 함수 and(논리곱), or(논리합), xor(배타적 논리합)
function and(a, b) {
  // 짧은 쪽 배열을 a로 한다.
  if (a.length > b.length) {
    [a, b] = [b, a];
  }
  return mint(
    a.map(function (element, element_nr) {
      return element_nr === sign ? plus : element & b[element_nr];
    })
  );
}

function or(a, b) {
  // 더 긴 배열이 a
  if (a.length < b.length) {
    [a, b] = [b, a];
  }
  return mint(
    a.map(function (element, element_nr) {
      return element_nr === sign ? plus : element | (b[element_nr] || 0);
    })
  );
}

function xor(a, b) {
  // 더 긴 배열이 a
  if (a.length < b.length) {
    [a, b] = [b, a];
  }
  return mint(
    a.map(function (element, element_nr) {
      return element_nr === sign ? plus : element ^ (b[element_nr] || 0);
    })
  );
}

// int 함수, 작은 정수와 큰 정수 값을 모두 쉽게 처리하는 데 도움
function int(big) {
  let result;
  if (typeof big === "number") {
    // 안전한 정수면 그대로 반환
    if (Number.isSafeInteger(big)) {
      return big;
    }
  } else if (is_big_integer(big)) {
    // 배열 길이에 따른 처리
    if (big.length < 2) {
      return 0;
    }
    if (big.length === 2) {
      return is_negative(big) ? -big[least] : big[least];
    }
    if (big.length === 3) {
      result = big[least + 1] * radix + big[least];
      return is_negative(big) ? -result : result;
    }
    if (big.length === 4) {
      result =
        big[least + 2] * radix_squared + big[least + 1] * radix + big[least];
      if (Number.isSafeInteger(result)) {
        return is_negative(big) ? -result : result;
      }
    }
  }
}

// 최하위 비트를 삭제해서 숫자의 크기를 줄인다. => 큰 정수 값을 더 작게 만든다.
// 비트를 좌우 방향성(오른쪽 시프트, 왼쪽 시프트)을 가지고 축소, 확대를 표현하는 것은 문제가 있다.

// 축소를 의미하는 down
function shift_down(big, places) {
  if (is_zero(big)) {
    return zero;
  }
  places = int(places);
  if (Number.isSafeInteger(places)) {
    if (places === 0) {
      return abs(big);
    }
    if (places < 0) {
      return shift_up(big, -places);
    }
    let skip = Math.floor(places / log2_radix);
    places -= skip * log2_radix;
    if (skip + 1 >= big.length) {
      return zero;
    }
    big = skip > 0 ? mint(zero.concat(big.slice(skip + 1))) : big;
    if (places === 0) {
      return big;
    }
    return mint(
      big.map(function (element, element_nr) {
        if (element_nr === sign) {
          return plus;
        }
        return (
          (radix - 1) &
          ((element >> places) |
            ((big[element_nr + 1] || 0) << (log2_radix - places)))
        );
      })
    );
  }
}

// 최하위 위치에 0을 끼워 넣어 숫자를 증가 => 큰 정수를 더 크게
function shift_up(big, places) {
  if (is_zero(big)) {
    return zero;
  }
  places = int(places);
  if (Number.isSafeInteger(places)) {
    if (places === 0) {
      return abs(big);
    }
    if (places < 0) {
      return shift_down(big, -places);
    }
    let blanks = Math.floor(places / log2_radix);
    let result = new Array(blanks + 1).fill(0);
    result[sign] = plus;
    places -= blanks * log2_radix;
    if (places === 0) {
      return mint(result.concat(big.slice(least)));
    }
    let carry = big.reduce(function (accumulator, element, element_nr) {
      if (element_nr === sign) {
        return 0;
      }
      result.push(((element << places) | accumulator) & (radix - 1));
      return element >> (log2_radix - places);
    }, 0);
    if (carry > 0) {
      result.push(carry);
    }
    return mint(result);
  }
}

// 모든 비트의 보수 생성
// 숫자를 위한 비트가 무제한 => 얼마나 많은 비트를 뒤집어야하는지 모름
// mask 함수를 통해 값이 1인 비트를 지정한 개수만큼 가진 큰 정수를 생성
function mask(nr_bits) {
  // 값이 1인 비트로만 구성된 문자열 생성
  nr_bits = int(nr_bits);
  if (nr_bits !== undefined && nr_bits >= 0) {
    let mega = Math.floor(nr_bits / log2_radix);
    let result = new Array(mega + 1).fill(radix - 1);
    result[sign] = plus;
    let leftover = nr_bits - mega * log2_radix;
    if (leftover > 0) {
      result.push((1 << leftover) - 1);
    }
    return mint(result);
  }
}

function not(a, nr_bits) {
  return xor(a, mask(nr_bits));
}

// 임의의 큰 정수 생성
// 생성할 비트 개수, 난수 생성기(없으면 Math.random)를 인자로 받는다.
function random(nr_bits, random = Math.random) {
  // 비트 1로 만들어진 문자열 생성
  const wuns = mask(nr_bits);
  if (wuns !== undefined) {
    // 각 메가디지트에 해당하는 0.0과 1.0 사이의 난수를 생성
    return mint(
      wuns.map(function (element, element_nr) {
        if (element_nr === sign) {
          return plus;
        }
        const bits = random();
        // 몇 개의 상위 비트와 하위 비트를 골라서 서로 xor, 그다음 메가디지트와 & 연산하여 새로운 숫자에 추가
        return ((bits * radix_squared) ^ (bits * radix)) & element;
      })
    );
  }
}

// 덧셈
// 더하기에 자리 올림수를 제공하기 위해 클로저 사용
function add(augend, addend) {
  if (is_zero(augend)) {
    return addend;
  }
  if (is_zero(addend)) {
    return augend;
  }
  // 부호가 다르면 뺄셈이 된다.
  if (augend[sign] !== addend[sign]) {
    return sub(augend, neg(addend));
  }
  // 부호가 같으면 모든 비트를 더하고 동일한 부호 지정
  // 길이가 서로 다른 경우, 더 긴 정수쪽에 map을 쓴 다음 || 연산자를 통해 짧은쪽에 존재하지 않는 요소에 0을 적용하여 덧셈 수행
  if (augend.length < addend.length) {
    [addend, augend] = [augend, addend];
  }
  let carry = 0;
  let result = augend.map(function (element, element_nr) {
    if (element_nr !== sign) {
      element += (addend[element_nr] || 0) + carry;
      if (element >= radix) {
        carry = 1;
        element -= radix;
      } else {
        carry = 0;
      }
    }
    return element;
  });
  // 숫자가 오버플로우 된 경우, 자리올림수(carry)를 저장할 배열 요소를 추가
  if (carry > 0) {
    result.push(carry);
  }
  return mint(result);
}

function sub(minuend, subtrahend) {
  if (is_zero(subtrahend)) {
    return minuend;
  }
  if (is_zero(minuend)) {
    return subtrahend;
  }
  let minuend_sign = minuend[sign];
  // 피연산자의 부호가 다르면 더하기로 전환
  if (minuend_sign !== subtrahend[sign]) {
    return add(minuend, neg(subtrahend));
  }
  // 더 큰 수에서 작은 수를 뺀다.
  if (abs_lt(minuend, subtrahend)) {
    [subtrahend, minuend] = [minuend, subtrahend];
    minuend_sign = minuend_sign === minus ? plus : minus;
  }
  let borrow = 0;
  return mint(
    minuend.map(function (element, element_nr) {
      if (element_nr === sign) {
        return minuend_sign;
      }
      let diff = element - ((subtrahend[element_nr] || 0) + borrow);
      if (diff < 0) {
        diff += 16777216;
        borrow = 1;
      } else {
        borrow = 0;
      }
      return diff;
    })
  );
}

// 곱셈
// multiplicand(피승수, 곱해지는 수)의 모든 요소를 multiplier(승수, 곱하는 수)의 모든 요소와 곱해야하기 때문에 forEach 사용
// 24비트를 초과하는 값은 반드시 자리올림수로 처리
function mul(multiplicand, multiplier) {
  if (is_zero(multiplicand) || is_zero(multiplier)) {
    return zero;
  }
  // 두 수의 부호가 같다면 결과는 양수
  let result = [multiplicand[sign] === multiplier[sign] ? plus : minus];
  // 자리 올림수를 계속 전달하면서 각 요소를 곱한다.
  multiplicand.forEach(function (
    multiplicand_element,
    multiplicand_element_nr
  ) {
    if (multiplicand_element_nr !== sign) {
      let carry = 0;
      multiplier.forEach(function (multiplier_element, multiplier_element_nr) {
        let at = multiplicand_element_nr + multiplier_element_nr - 1;
        let product =
          multiplicand_element * multiplier_element + (result[at] || 0) + carry;
        result[at] = product & 16777215;
        carry = Math.floor(product / radix);
      });
      if (carry > 0) {
        result[multiplicand_element_nr + multiplier.length - 1] = carry;
      }
    }
  });
  return mint(result);
}

// 나눗셈
// divrem은 몫과 나머지 모두 반환, div는 몫만 반환
function divrem(dividend, divisor) {
  if (is_zero(dividend) || abs_lt(dividend, divisor)) {
    return [zero, dividend];
  }
  if (is_zero(divisor)) {
    return undefined;
  }
  // 피연사자들을 양수로 전환
  let quotient_is_negative = dividend[sign] !== divisor[sign];
  let remainder_is_negative = dividend[sign] === minus;
  let remainder = dividend;
  dividend = abs(dividend);
  divisor = abs(divisor);
  // 나눗셈 알고리즘
  let shift = Math.clz32(last(divisor)) - 8;

  dividend = shift_up(dividend, shift);
  divisor = shift_up(divisor, shift);
  let place = dividend.length - divisor.length;
  let dividend_prefix = last(dividend);
  let divisor_prefix = last(divisor);
  if (dividend_prefix < divisor_prefix) {
    dividend_prefix = dividend_prefix * radix + next_to_last(dividend);
  } else {
    place += 1;
  }
  divisor = shift_up(divisor, (place - 1) * 24);
  let quotient = new Array(place + 1).fill(0);
  quotient[sign] = plus;
  while (true) {
    let estimated = Math.floor(dividend_prefix / divisor_prefix);
    if (estimated > 0) {
      while (true) {
        let trial = sub(dividend, mul(divisor, [plus, estimated]));
        if (!is_negative(trial)) {
          dividend = trial;
          break;
        }
        estimated -= 1;
      }
    }
    quotient[place] = estimated;
    place -= 1;
    if (place === 0) {
      break;
    }
    if (is_zero(dividend)) {
      break;
    }
    dividend_prefix = last(dividend) * radix + next_to_last(dividend);
    divisor = shift_down(divisor, 24);
  }
  quotient = mint(quotient);
  remainder = shift_down(dividend, shift);
  return [
    quotient_is_negative ? neg(quotient) : quotient,
    remainder_is_negative ? neg(remainder) : remainder,
  ];
}

function div(dividend, divisor) {
  let temp = divrem(dividend, divisor);
  if (temp) {
    return temp[0];
  }
}

// 거듭 제곱
function power(big, exponent) {
  let exp = int(exponent);
  if (exp === 0) {
    return wun;
  }
  if (is_zero(big)) {
    return zero;
  }
  if (exp === undefined || exp < 0) {
    return undefined;
  }
  let result = wun;
  while (true) {
    if ((exp & 1) !== 0) {
      result = mul(result, big);
    }
    exp = Math.floor(exp / 2);
    if (exp < 1) {
      break;
    }
    big = mul(big, big);
  }
  return mint(result);
}

// 기약분수 생성
function gcd(a, b) {
  a = abs(a);
  b = abs(b);
  while (!is_zero(b)) {
    let [ignore, remainder] = divrem(a, b);
    a = b;
    b = remainder;
  }
  return a;
}

// 숫자를 문자로 매핑
const digitset = "0123456789ABCDEFGHJKMNPQRSTVWXYZ*~$=U";
// 문자를 숫자로 매핑
const charset = (function (object) {
  digitset.split("").forEach(function (element, element_nr) {
    object[element] = element_nr;
  });
  return Object.freeze(object);
})(Object.create(null));

// 숫자나 문자열, 그리고 선택적으로 기수 값을 받아서 큰 정수 값을 반환
function make(value, radix_2_37) {
  // value = 문자열, 정수, 큰 정수, 만약 문자열이면 부수적으로 기수값 지정
  let result;
  // 문자열
  if (typeof value === "string") {
    let radish;
    if (radix_2_37 === undefined) {
      radix_2_37 = 10;
      radish = ten;
    } else {
      if (!Number.isInteger(radix_2_37) || radix_2_37 < 2 || radix_2_37 > 37) {
        return undefined;
      }
      radish = make(radix_2_37);
    }
    result = zero;
    let good = false;
    let negative = false;
    if (
      value
        .toUpperCase()
        .split("")
        .every(function (element, element_nr) {
          let digit = charset[element];
          if (digit !== undefined && digit < radix_2_37) {
            result = add(mul(result, radish), [plus, digit]);
            good = true;
            return true;
          }
          if (element_nr === sign) {
            if (element === plus) {
              return true;
            }
            if (element === minus) {
              negative = true;
              return true;
            }
          }
          return digit === "_";
        }) &&
      good
    ) {
      if (negative) {
        result = neg(result);
      }
      return mint(result);
    }
    return undefined;
  }
  // 정수
  if (Number.isInteger(value)) {
    let whole = Math.abs(value);
    result = [value < 0 ? minus : plus];
    while (whole >= radix) {
      let quotient = Math.floor(whole / radix);
      result.push(whole - quotient * radix);
      whole = quotient;
    }
    if (whole > 0) {
      result.push(whole);
    }
    return mint(result);
  }
  // 큰 정수
  if (Array.isArray(value)) {
    return mint(value);
  }
}

// 큰 정수 값을 자바스크립트 수로 변환, 값이 안전한 정수 범위 내에 있을 때만 변환이 정확함
function number(big) {
  let value = 0;
  let the_sign = 1;
  let factor = 1;
  big.forEach(function (element, element_nr) {
    if (element_nr === 0) {
      if (element === minus) {
        the_sign = -1;
      }
    } else {
      value += element * factor;
      factor *= radix;
    }
  });
  return the_sign * value;
}

// 큰 정수 값을 문자열로 변환
function string(a, radix_2_thru_37 = 10) {
  if (is_zero(a)) {
    return "0";
  }
  radix_2_thru_37 = int(radix_2_thru_37);
  if (
    !Number.isSafeInteger(radix_2_thru_37) ||
    radix_2_thru_37 < 2 ||
    radix_2_thru_37 > 37
  ) {
    return undefined;
  }
  const radish = make(radix_2_thru_37);
  const the_sign = a[sign] === minus ? "-" : "";
  a = abs(a);
  let digits = [];
  while (!is_zero(a)) {
    let [quotient, remainder] = divrem(a, radish);
    digits.push(digitset[number(remainder)]);
    a = quotient;
  }
  digits.push(the_sign);
  return digits.reverse().join("");
}

// 큰 정수에서 값이 1인 비트 개수를 세어서 반환

// 32비트 정수에서의 경우
function population_32(int32) {
  int32 -= (int32 >>> 1) & 0x55555555;
  int32 = (int32 & 0x33333333) + ((int32 >>> 2) & 0x33333333);
  int32 = (int32 + (int32 >>> 4)) & 0x0f0f0f0f;
  int32 = (int32 + (int32 >>> 8)) & 0x001f001f;
  return (int32 + (int32 >>> 16)) & 0x0000003f;
}

function population(big) {
  return big.reduce(function (reduction, element, element_nr) {
    return reduction + (element_nr === sign ? 0 : population_32(element));
  }, 0);
}

// 앞쪽의 0들을 제외한 전체 비트 수를 반환
function significant_bits(big) {
  return big.length > 1
    ? make((big.length - 2) * log2_radix + (32 - Math.clz32(last(big))))
    : zero;
}

export default Object.freeze({
  abs,
  abs_lt,
  add,
  and,
  div,
  divrem,
  eq,
  gcd,
  is_big_integer,
  is_negative,
  is_positive,
  is_zero,
  lt,
  make,
  mask,
  mul,
  neg,
  not,
  number,
  or,
  population,
  power,
  random,
  shift_down,
  shift_up,
  significant_bits,
  signum,
  string,
  sub,
  ten,
  two,
  wun,
  xor,
  zero,
});
