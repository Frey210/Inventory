export function quantityInput(fractional = false, zero = false) {
  return {
    step: fractional ? "0.0001" : "1",
    min: zero ? "0" : fractional ? "0.0001" : "1",
  };
}
