function digitsOnly(value: string): string {
  return value.replace(/[^\d]/g, "");
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/**
 * Pasang format "Rp 1.000.000" otomatis ke input teks saat user ngetik.
 * Input harus type="text" (bukan type="number", supaya titik pemisah
 * ribuan bisa ditampilkan). Nilai murni bisa dibaca lagi lewat
 * getRupiahValue(input).
 */
export function attachRupiahFormatting(input: HTMLInputElement): void {
  input.addEventListener("input", () => {
    const digits = digitsOnly(input.value);
    input.value = digits ? `Rp ${groupThousands(digits)}` : "";
  });
  input.addEventListener("focus", () => {
    if (!input.value) input.value = "Rp ";
  });
  input.addEventListener("blur", () => {
    if (input.value === "Rp ") input.value = "";
  });
}

/** Set nilai awal input Rupiah dari angka murni (mis. saat buka form edit). */
export function setRupiahValue(input: HTMLInputElement, value: number | null | undefined): void {
  const digits = value != null ? String(Math.max(0, Math.round(value))) : "";
  input.value = digits ? `Rp ${groupThousands(digits)}` : "";
}

/** Baca nilai murni (number) dari input yang sudah diformat Rupiah. */
export function getRupiahValue(input: HTMLInputElement): number {
  const digits = digitsOnly(input.value);
  return digits ? Number(digits) : 0;
}
