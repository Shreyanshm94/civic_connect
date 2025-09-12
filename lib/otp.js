export function generateOtp() {
  // 6-digit, leading zeroes allowed
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function minutesFromNow(mins = 10) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + mins);
  return d;
}
