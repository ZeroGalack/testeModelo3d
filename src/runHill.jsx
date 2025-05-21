// Gerador de ruído gaussiano (Box–Muller)
function randn() {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

export function runHill(L, t) {
  const a = 37.24;
  const b = 0.335;
  const PO = a / 0.257;
  const vm = (PO * b) / a;
  const alpha = PO / 0.1;
  const Lse0 = 0.3;
  const k = a / 25;
  const Erro_Forca = PO / 100;
  const Erro_Calor = k / 10;

  const n = t.length;
  const Lse = Array(n).fill(Lse0);
  const Lce = Array(n).fill(1 - Lse0);
  const H = Array(n).fill(0);
  const P = Array(n).fill(0);

  for (let j = 0; j < n - 1; j++) {
    Lse[j] = Lse0 + P[j] / alpha;
    Lce[j] = L[j] - Lse[j];

    const dt = t[j + 1] - t[j];
    const dL = L[j + 1] - L[j];

    const v = (b * (PO - P[j])) / (a + P[j]);

    const dP = alpha * (dL / dt + v) * dt;
    P[j + 1] = P[j] + dP;

    const dH = (a * v + k) * dt;
    H[j + 1] = H[j] + dH;
  }

  // Última posição
  Lse[n - 1] = Lse0 + P[n - 1] / alpha;
  Lce[n - 1] = L[n - 1] - Lse[n - 1];

  // Adiciona ruído
  // for (let i = 0; i < n; i++) {
  //   H[i] += Erro_Calor * randn();
  //   P[i] += Erro_Forca * randn();
  // }

  return { P, H, Lse, Lce };
}

export default runHill;
