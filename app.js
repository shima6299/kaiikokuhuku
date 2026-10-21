'use strict';

const byId = id => document.getElementById(id);
const numberFormat = new Intl.NumberFormat('ja-JP');
const form = byId('calculator');

function readInteger(id, label, min, max = Number.MAX_SAFE_INTEGER) {
  const raw = byId(id).value.trim();
  const value = Number(raw);
  if (!raw || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(`${label}は${numberFormat.format(min)}〜${numberFormat.format(max)}の整数で入力してください。`);
  }
  return value;
}

// 出典：まかろんのゲームメモ。区間は「出発レベル」。
// 例：Lv.10→11は100pt、Lv.11→12は150pt。
const LEVEL_POINTS = [
  [10, 100], [30, 150], [40, 200], [60, 250], [80, 500],
  [100, 1000], [140, 1200], [160, 1300], [180, 1350],
  [200, 1400], [240, 1600], [260, 1650], [280, 1700], [299, 1800]
];
function pointsForLevel(level) {
  return LEVEL_POINTS.find(([end]) => level <= end)[1];
}

function calculate() {
  try {
    const current = readInteger('current', '現在レベル', 1, 300);
    const target = readInteger('target', '目標レベル', 1, 300);
    const progress = readInteger('progress', '獲得済みポイント', 0, 1000000);
    const perQuest = readInteger('per-quest', '1クエストの獲得ポイント', 1, 10000000);
    if (target < current) throw new Error('目標レベルは現在レベル以上にしてください。');
    if (current < 300 && progress >= pointsForLevel(current)) {
      throw new Error('獲得済みポイントは、現在レベルから次のレベルまでの必要ポイント未満にしてください。');
    }
    if (current === 300 && progress !== 0) throw new Error('Lv.300は上限です。獲得済みポイントは0にしてください。');
    let total = 0;
    for (let level = current; level < target; level++) {
      total += pointsForLevel(level);
    }
    total = Math.max(0, total - progress);
    const runs = Math.ceil(total / perQuest);
    byId('total').textContent = numberFormat.format(total);
    byId('from-label').textContent = `Lv.${current}`;
    byId('to-label').textContent = `Lv.${target}`;
    byId('levels').replaceChildren(document.createTextNode(numberFormat.format(target - current)), unit(' Lv.'));
    byId('runs').replaceChildren(document.createTextNode(numberFormat.format(runs)), unit(' 回'));
    byId('result-note').textContent = total === 0 ? '目標レベルに到達済みです。次の研究目標も設定できます。' : `1回${numberFormat.format(perQuest)} pt獲得する場合の目安です。端数は切り上げています。`;
    byId('calculation-info').textContent = 'レベルごとの必要ptを自動で合計 − 獲得済みpt';
    byId('error').hidden = true;
    byId('results').hidden = false;
    document.querySelectorAll('[data-target]').forEach(button => button.classList.toggle('active', Number(button.dataset.target) === target));
    return true;
  } catch (error) {
    byId('error').textContent = error.message;
    byId('error').hidden = false;
    byId('results').hidden = true;
    return false;
  }
}

function unit(text) {
  const element = document.createElement('small');
  element.textContent = text;
  return element;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  calculate();
});
form.addEventListener('input', () => {
  byId('selection-status').textContent = '';
  calculate();
});
document.querySelectorAll('[data-target]').forEach(button => {
  button.addEventListener('click', () => {
    byId('target').value = button.dataset.target;
    calculate();
  });
});
document.querySelectorAll('.use-quest').forEach(button => {
  button.addEventListener('click', () => {
    if (!button.dataset.points) {
      byId('per-quest').value = '';
      byId('per-quest').placeholder = 'リザルト画面の獲得pt';
      byId('results').hidden = true;
      byId('error').hidden = true;
      byId('selection-status').textContent = `${button.dataset.name}を選びました。獲得ポイントは討究レベル・クエスト条件などで変わるため、リザルト画面の値を入力してください。`;
      byId('per-quest').focus();
      return;
    }
    byId('per-quest').value = button.dataset.points;
    const success = calculate();
    byId('selection-status').textContent = `${button.dataset.name}の仮定値（${numberFormat.format(Number(button.dataset.points))} pt / 回）を反映しました。${success ? '' : '入力エラーを修正してください。'}`;
  });
});
calculate();
