export function formatRupeesFromPaise(paise: number) {
  const rupees = Math.round(paise) / 100;
  return rupees.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
}

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}
