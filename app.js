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

function readLevelTable(text) {
  const table = new Map();
  text.split('\n').forEach((line, index) => {
    if (!line.trim()) return;
    const match = line.trim().match(/^(\d+)\s*[,，]\s*(\d+)$/);
    if (!match) throw new Error(`レベル別設定の${index + 1}行目は「レベル,必要pt」の形式で入力してください。`);
    const level = Number(match[1]);
    const points = Number(match[2]);
    if (level < 1 || level > 299 || points < 1 || points > 1000000) {
      throw new Error(`レベル別設定の${index + 1}行目：レベルは1〜299、必要ptは1〜1,000,000で入力してください。`);
    }
    if (table.has(level)) throw new Error(`レベル別設定でLv.${level}が重複しています。`);
    table.set(level, points);
  });
  return table;
}

function calculate() {
  try {
    const current = readInteger('current', '現在レベル', 1, 300);
    const target = readInteger('target', '目標レベル', 1, 300);
    const progress = readInteger('progress', '獲得済みポイント', 0, 1000000);
    const perLevel = readInteger('per-level', '1レベルあたりの必要ポイント', 1, 1000000);
    const perQuest = readInteger('per-quest', '1クエストの獲得ポイント', 1, 10000000);
    const table = readLevelTable(byId('level-data').value);
    if (target < current) throw new Error('目標レベルは現在レベル以上にしてください。');
    if (current < 300 && progress >= (table.get(current) ?? perLevel)) {
      throw new Error('獲得済みポイントは、現在レベルから次のレベルまでの必要ポイント未満にしてください。');
    }
    if (current === 300 && progress !== 0) throw new Error('Lv.300は上限です。獲得済みポイントは0にしてください。');
    let total = 0;
    let customCount = 0;
    for (let level = current; level < target; level++) {
      total += table.get(level) ?? perLevel;
      if (table.has(level)) customCount++;
    }
    total = Math.max(0, total - progress);
    const runs = Math.ceil(total / perQuest);
    byId('total').textContent = numberFormat.format(total);
    byId('from-label').textContent = `Lv.${current}`;
    byId('to-label').textContent = `Lv.${target}`;
    byId('levels').replaceChildren(document.createTextNode(numberFormat.format(target - current)), unit(' Lv.'));
    byId('runs').replaceChildren(document.createTextNode(numberFormat.format(runs)), unit(' 回'));
    byId('result-note').textContent = total === 0 ? '目標レベルに到達済みです。次の研究目標も設定できます。' : `1回${numberFormat.format(perQuest)} pt獲得する場合の目安です。端数は切り上げています。`;
    byId('calculation-info').textContent = customCount ? `レベル別設定 ${customCount}件と共通値を合計 − 獲得済みpt（入力値による試算）` : '共通の必要pt × レベル差 − 獲得済みpt（入力値による試算）';
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
  byId('results').hidden = true;
  byId('error').hidden = true;
  byId('selection-status').textContent = '';
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
