import { MathChallengeProblem } from '../types';

export function generateMathProblem(): MathChallengeProblem {
  const operations = ['+', '-', '×'];
  const op = operations[Math.floor(Math.random() * operations.length)];
  let a = 0;
  let b = 0;
  let answer = 0;

  if (op === '+') {
    a = Math.floor(Math.random() * 40) + 12; // 12 to 51
    b = Math.floor(Math.random() * 40) + 12; // 12 to 51
    answer = a + b;
  } else if (op === '-') {
    a = Math.floor(Math.random() * 50) + 30; // 30 to 79
    b = Math.floor(Math.random() * 25) + 10; // 10 to 34
    answer = a - b;
  } else {
    // Multiplication (single digit tables 3-9)
    a = Math.floor(Math.random() * 7) + 3; // 3 to 9
    b = Math.floor(Math.random() * 7) + 3; // 3 to 9
    answer = a * b;
  }

  const question = `${a} ${op} ${b}`;

  // Generate 3 unique wrong options close to answer
  const wrongAnswers = new Set<number>();
  while (wrongAnswers.size < 3) {
    const offset = (Math.floor(Math.random() * 6) + 1) * (Math.random() > 0.5 ? 1 : -1);
    const candidate = answer + offset;
    if (candidate !== answer && candidate >= 0) {
      wrongAnswers.add(candidate);
    }
  }

  const options = Array.from(wrongAnswers);
  options.push(answer);
  // Shuffle options
  options.sort(() => Math.random() - 0.5);

  return {
    question,
    answer,
    options,
  };
}
