/**
 * 独立应用「桌宠配置」页：宠物列表 / 人设 / 物理参数 / 全局开关。
 *
 * 与 DSH 自带设置页的关系：那是跑在 DSH 网页插槽里的 React 组件，依赖宿主注入的 react、
 * 翻译与容器桥，直接搬进浏览器只会白屏；这里按独立模式**实际具备的能力**重做一页原生实现，
 * 数据仍走同一个本机 `/config` 接口（GET 读成品、PUT 写用户层并重启桌面窗口）。
 * 必须始终成立：页面不内联脚本以外的外部资源；令牌只从地址片段读一次并立刻抹掉。
 * @module dsh-pet/src/standalone/pet-config-page
 */

import { ROUTE_PATH } from '../shared/constants.ts';

/** 桌宠配置页 HTML。 */
export const petConfigPage = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>桌宠配置</title><link rel="stylesheet" href="/standalone-ai/pet-config.css">
<script src="/standalone-ai/pet-config.js" defer></script></head><body>
<div class="bar"><span class="brand">dsh-pet</span>
<nav class="tabs"><a class="tab active" href="#">桌宠配置</a><a class="tab" id="to-ai" href="/standalone-ai/">模型接口</a></nav></div>
<main>
<p id="banner" class="banner" hidden></p>
<section class="card"><h2>桌宠</h2>
<p class="hint">每只宠物可单独设置外观、位置与动作节奏。「显示位置」选「仅网页」时，独立桌面端不会开窗。</p>
<div id="pets"></div>
<button id="add" class="ghost" type="button">＋ 添加宠物</button></section>
<section class="card"><h2>全局开关</h2><div id="globals" class="grid"></div></section>
<section class="card"><h2>物理参数</h2>
<p class="hint">影响拖拽甩出手感与落地弹跳，保存后立即生效。</p>
<div id="physics" class="grid"></div></section>
<footer><button id="save" type="submit" disabled>保存并应用</button><span id="status" role="status" aria-live="polite">正在读取配置…</span></footer>
</main></body></html>`;

/** 桌宠配置页样式（与 AI 设置页同一套视觉，卡片化）。 */
export const petConfigStyle = `
:root{color-scheme:light;--ink:#203b4b;--muted:#526a78;--blue:#12618b;--line:#cbdce5;--paper:#fff;--water:#edf5fa}
*{box-sizing:border-box}body{margin:0;background:var(--water);color:var(--ink);font:14px/1.6 "Microsoft YaHei UI","PingFang SC",system-ui,sans-serif}
.bar{position:sticky;top:0;z-index:20;display:flex;align-items:center;gap:18px;padding:10px 22px;background:#fff;border-bottom:1px solid var(--line)}
.brand{font-weight:700;font-size:15px;letter-spacing:.5px}
.tabs{display:flex;gap:6px}.tab{display:inline-block;padding:6px 14px;border-radius:7px;color:var(--muted);text-decoration:none;font-weight:600}
.tab.active{background:var(--water);color:var(--blue)}.tab:hover{background:#f0f6fa}
main{max-width:1000px;margin:0 auto;padding:22px 22px 80px}
.card{background:var(--paper);border:1px solid var(--line);border-radius:14px;padding:20px 22px;margin-bottom:18px}
.card h2{font-size:17px;margin:0 0 6px}
.hint{font-size:12px;color:var(--muted);margin:0 0 14px}
.banner{background:#fff3f2;border:1px solid #e6b3ab;color:#a13b30;border-radius:10px;padding:12px 14px;font-size:13px;margin:0 0 16px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:14px 18px}
.field{display:flex;flex-direction:column;gap:5px;min-width:0}
.field>span{font-weight:600;font-size:13px}
.field>em{font-style:normal;font-size:11px;color:var(--muted)}
input:not([type=checkbox]),select,textarea{width:100%;min-height:38px;border:1px solid #a5bdcb;border-radius:7px;background:#fff;color:var(--ink);padding:7px 10px;font:inherit;font-size:14px}
textarea{resize:vertical;min-height:64px}
input[type=checkbox]{accent-color:var(--blue);width:16px;height:16px;margin:0}
.pet{border:1px solid var(--line);border-radius:12px;padding:16px 16px 14px;margin-bottom:14px;background:#fbfdfe}
.pet-head{display:flex;align-items:center;gap:10px;margin-bottom:12px}
.pet-title{font-weight:700;font-size:15px}
.pet-head code{font-size:11px;color:var(--muted);background:var(--water);border-radius:5px;padding:2px 6px}
.pet-head .spacer{flex:1}
.flags{display:flex;flex-wrap:wrap;gap:8px 20px;margin-top:14px;padding-top:12px;border-top:1px dashed var(--line)}
.flags label{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer}
button{border:0;border-radius:8px;min-height:42px;padding:9px 20px;background:var(--blue);color:#fff;font:600 14px/1.5 inherit;cursor:pointer}
button:hover{background:#0b4e73}button:disabled{opacity:.55;cursor:wait}
button.ghost{background:#fff;color:var(--blue);border:1.5px solid var(--blue)}
button.ghost:hover{background:var(--water)}
button.danger{background:#fff;color:#a13b30;border:1px solid #e0b3ac;min-height:32px;padding:4px 12px;font-size:13px}
button.danger:hover{background:#fdf1ef}
footer{display:flex;align-items:center;gap:18px;position:sticky;bottom:0;background:rgba(237,245,250,.95);padding:14px 0;border-top:1px solid var(--line)}
#status{font-size:13px;color:var(--blue)}#status[data-error=true]{color:#a13b30}
@media(max-width:560px){main{padding:16px 14px 70px}.grid{grid-template-columns:1fr}}
`;

/** 桌宠配置页脚本：原生 DOM 实现，不依赖任何框架。 */
export const petConfigScript = `
'use strict';
(() => {
  const ROUTE = '${ROUTE_PATH}';
  const token = new URLSearchParams(location.hash.slice(1)).get('token') || '';
  history.replaceState(null, '', location.pathname);
  const toAi = document.getElementById('to-ai');
  if (toAi) toAi.href = '/standalone-ai/' + (token ? '#token=' + token : '');

  const banner = document.getElementById('banner');
  const petsBox = document.getElementById('pets');
  const globalsBox = document.getElementById('globals');
  const physicsBox = document.getElementById('physics');
  const saveBtn = document.getElementById('save');
  const statusEl = document.getElementById('status');
  const state = { pets: [], main: {}, entryPrompt: '' };

  function say(text, error) {
    if (!statusEl) return;
    statusEl.textContent = text;
    statusEl.dataset.error = error ? 'true' : 'false';
  }
  function warn(text) {
    if (!banner) return;
    banner.hidden = false;
    banner.textContent = text;
  }

  async function api(method, body) {
    const init = { method, credentials: 'omit', cache: 'no-store', headers: { 'X-DSH-Pet-Token': token } };
    if (body !== undefined) {
      init.headers['content-type'] = 'application/json';
      init.body = JSON.stringify(body);
    }
    const response = await fetch(ROUTE + '/config', init);
    if (response.status === 403) throw new Error('打开凭据已失效，请从右键菜单「桌宠配置」重新打开本页。');
    if (!response.ok) throw new Error('保存失败：配置未通过校验，请检查 ID、大小、边距是否为合法值。');
    return response.json();
  }

  function node(tag, className, text) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  }
  function field(label, control, note) {
    const wrap = node('label', 'field');
    wrap.appendChild(node('span', '', label));
    wrap.appendChild(control);
    if (note) wrap.appendChild(node('em', '', note));
    return wrap;
  }
  function textInput(value, onInput, placeholder) {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value == null ? '' : String(value);
    if (placeholder) input.placeholder = placeholder;
    input.addEventListener('input', () => onInput(input.value));
    return input;
  }
  function numInput(value, min, max, step, onInput) {
    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(min); input.max = String(max); input.step = String(step);
    input.value = value == null ? '' : String(value);
    input.addEventListener('input', () => onInput(Number(input.value)));
    return input;
  }
  function selectInput(options, value, onChange) {
    const select = document.createElement('select');
    for (const [id, label] of options) {
      const option = document.createElement('option');
      option.value = id; option.textContent = label;
      if (id === value) option.selected = true;
      select.appendChild(option);
    }
    select.addEventListener('change', () => onChange(select.value));
    return select;
  }
  function checkInput(label, checked, onChange) {
    const wrap = node('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = !!checked;
    input.addEventListener('change', () => onChange(input.checked));
    wrap.appendChild(input);
    wrap.appendChild(node('span', '', label));
    return wrap;
  }

  const DISPLAYS = [['desktop', '仅桌面'], ['both', '桌面 + 网页'], ['web', '仅网页'], ['none', '都不显示']];
  const CORNERS = [['top-right', '右上'], ['top-left', '左上'], ['bottom-right', '右下'], ['bottom-left', '左下']];
  const FLAGS = [
    ['whisperEnabled', '碎碎念'],
    ['balanceEnabled', '余额'],
    ['workStatusEnabled', '工作状态'],
    ['fixedEnabled', '固定不动'],
  ];

  function renderPets() {
    petsBox.textContent = '';
    state.pets.forEach((pet, index) => {
      const card = node('div', 'pet');
      const head = node('div', 'pet-head');
      const title = node('span', 'pet-title', pet.name || pet.id);
      head.appendChild(title);
      head.appendChild(node('code', '', pet.id));
      head.appendChild(node('span', 'spacer'));
      const del = node('button', 'danger', '删除');
      del.type = 'button';
      del.addEventListener('click', () => removePet(index));
      head.appendChild(del);
      card.appendChild(head);

      const grid = node('div', 'grid');
      grid.appendChild(field('名称', textInput(pet.name, (v) => { pet.name = v; title.textContent = v || pet.id; }, '显示名称')));
      grid.appendChild(field('大小（像素）', numInput(pet.size, 120, 900, 10, (v) => { pet.size = v; }), '120 – 900'));
      grid.appendChild(field('显示位置', selectInput(DISPLAYS, pet.display, (v) => { pet.display = v; })));
      grid.appendChild(field('停靠角落', selectInput(CORNERS, pet.position && pet.position.corner, (v) => { pet.position.corner = v; })));
      grid.appendChild(field('水平边距', numInput(pet.position && pet.position.marginX, 0, 4000, 1, (v) => { pet.position.marginX = v; })));
      grid.appendChild(field('垂直边距', numInput(pet.position && pet.position.marginY, 0, 4000, 1, (v) => { pet.position.marginY = v; })));
      grid.appendChild(
        field(
          '动作间隔（秒）',
          numInput(pet.actionIntervalSec, 0, 3600, 0.5, (v) => { pet.actionIntervalSec = v; }),
          '0 = 上一个动作播完立刻接下一个',
        ),
      );
      card.appendChild(grid);

      const persona = document.createElement('textarea');
      persona.rows = 3;
      persona.value = typeof pet.whisperPrompt === 'string' ? pet.whisperPrompt : '';
      persona.placeholder = state.entryPrompt
        ? '留空则跟随通用人设：' + state.entryPrompt.slice(0, 40) + (state.entryPrompt.length > 40 ? '…' : '')
        : '留空则使用默认人设';
      persona.addEventListener('input', () => { pet.whisperPrompt = persona.value; });
      card.appendChild(field('人设（碎碎念的说话方式）', persona, '只影响这只宠物的碎碎念文案'));

      const flags = node('div', 'flags');
      for (const [key, label] of FLAGS) {
        flags.appendChild(checkInput(label, pet[key] !== false, (v) => { pet[key] = v; }));
      }
      card.appendChild(flags);
      petsBox.appendChild(card);
    });
  }

  function nextPetId() {
    let index = 2;
    while (state.pets.some((pet) => pet.id === 'pet' + index)) index += 1;
    return 'pet' + index;
  }

  function addPet() {
    const template = state.pets[state.pets.length - 1];
    const position = (template && template.position) || { corner: 'bottom-right', marginX: 24, marginY: 24 };
    state.pets.push({
      id: nextPetId(),
      name: '新宠物',
      size: template && Number.isFinite(template.size) ? template.size : 420,
      balanceEnabled: true,
      whisperEnabled: false,
      workStatusEnabled: false,
      fixedEnabled: false,
      display: (template && template.display) || 'desktop',
      position: { corner: position.corner, marginX: position.marginX, marginY: position.marginY },
      whisperPrompt: '',
    });
    renderPets();
  }

  function removePet(index) {
    if (state.pets.length <= 1) { say('至少要保留一只宠物。', true); return; }
    state.pets.splice(index, 1);
    renderPets();
  }

  function renderGlobals(main) {
    globalsBox.textContent = '';
    const items = [
      ['trayEnabled', '系统托盘图标', main.trayEnabled !== false],
      ['clickSoundEnabled', '点击音效', main.clickSoundEnabled === true],
      ['confineToScreen', '甩出后限制在屏幕内', main.confineToScreen === true],
      ['notificationsEnabled', '系统通知', main.notificationsEnabled !== false],
      ['whisperImageEnabled', '碎碎念配图', main.whisperImageEnabled === true],
    ];
    for (const [key, label, checked] of items) {
      const wrap = node('label', 'field');
      const line = node('div');
      line.style.display = 'flex';
      line.style.alignItems = 'center';
      line.style.gap = '8px';
      line.appendChild(checkInput(label, checked, (v) => { state.main[key] = v; }));
      wrap.appendChild(line);
      globalsBox.appendChild(wrap);
    }
  }

  function renderPhysics(physics) {
    physicsBox.textContent = '';
    const value = physics || {};
    const set = (key) => (v) => { state.physics[key] = v; };
    physicsBox.appendChild(field('重力', numInput(value.gravity, 0, 5000, 50, set('gravity')), '越大下落越快'));
    physicsBox.appendChild(field('弹性', numInput(value.restitution, 0, 1, 0.05, set('restitution')), '0 – 1，越大弹得越高'));
    physicsBox.appendChild(field('地面摩擦', numInput(value.groundFriction, 0, 50, 0.5, set('groundFriction')), '越大滑得越近'));
    physicsBox.appendChild(field('抛掷力度', numInput(value.throwPower, 0.1, 10, 0.1, set('throwPower')), '拖拽甩出的力度倍数'));
    const wrap = node('label', 'field');
    const line = node('div');
    line.style.display = 'flex';
    line.style.alignItems = 'center';
    line.style.gap = '8px';
    line.appendChild(checkInput('天花板反弹', value.ceilingBounce !== false, (v) => { state.physics.ceilingBounce = v; }));
    wrap.appendChild(line);
    physicsBox.appendChild(wrap);
    const wrap2 = node('label', 'field');
    const line2 = node('div');
    line2.style.display = 'flex';
    line2.style.alignItems = 'center';
    line2.style.gap = '8px';
    line2.appendChild(checkInput('宠物互相碰撞', value.petCollision !== false, (v) => { state.physics.petCollision = v; }));
    wrap2.appendChild(line2);
    physicsBox.appendChild(wrap2);
  }

  function apply(merged) {
    const main = merged && merged.main;
    if (!main || !Array.isArray(main.pets) || !main.pets.length) throw new Error('宿主返回的配置无法识别。');
    state.pets = main.pets.map((pet) => ({
      ...pet,
      position: { ...(pet.position || { corner: 'bottom-right', marginX: 24, marginY: 24 }) },
    }));
    state.main = {
      trayEnabled: main.trayEnabled !== false,
      clickSoundEnabled: main.clickSoundEnabled === true,
      confineToScreen: main.confineToScreen === true,
      notificationsEnabled: main.notificationsEnabled !== false,
      whisperImageEnabled: main.whisperImageEnabled === true,
    };
    state.physics = { ...(main.physics || {}) };
    state.entryPrompt = typeof main.whisperPrompt === 'string' ? main.whisperPrompt : '';
    renderPets();
    renderGlobals(state.main);
    renderPhysics(state.physics);
    saveBtn.disabled = false;
  }

  function body() {
    return {
      pets: state.pets.map((pet) => ({
        id: String(pet.id),
        name: pet.name || String(pet.id),
        size: Number(pet.size),
        balanceEnabled: pet.balanceEnabled !== false,
        whisperEnabled: pet.whisperEnabled !== false,
        workStatusEnabled: pet.workStatusEnabled !== false,
        fixedEnabled: pet.fixedEnabled === true,
        display: pet.display,
        position: {
          corner: pet.position.corner,
          marginX: Number(pet.position.marginX),
          marginY: Number(pet.position.marginY),
        },
        whisperPrompt: typeof pet.whisperPrompt === 'string' ? pet.whisperPrompt : '',
        actionIntervalSec: Number.isFinite(Number(pet.actionIntervalSec)) ? Math.max(0, Number(pet.actionIntervalSec)) : 0,
      })),
      trayEnabled: state.main.trayEnabled,
      clickSoundEnabled: state.main.clickSoundEnabled,
      confineToScreen: state.main.confineToScreen,
      notificationsEnabled: state.main.notificationsEnabled,
      whisperImageEnabled: state.main.whisperImageEnabled,
      physics: {
        gravity: Number(state.physics.gravity),
        restitution: Number(state.physics.restitution),
        groundFriction: Number(state.physics.groundFriction),
        throwPower: Number(state.physics.throwPower),
        ceilingBounce: state.physics.ceilingBounce !== false,
        petCollision: state.physics.petCollision !== false,
      },
    };
  }

  saveBtn.addEventListener('click', async () => {
    saveBtn.disabled = true;
    say('正在保存…');
    try {
      apply(await api('PUT', body()));
      say('已保存：桌面宠物已按新配置重建。');
    } catch (error) {
      say(error.message || '保存失败。', true);
    } finally {
      saveBtn.disabled = false;
    }
  });
  document.getElementById('add').addEventListener('click', addPet);

  if (!token) {
    warn('这个页面需要访问凭据：请右键桌宠 →「桌宠配置」打开，直接输地址打不开读写。');
    say('未获得访问凭据，只能查看不能保存。', true);
    return;
  }
  api('GET')
    .then((merged) => { apply(merged); say('读取完成。修改后点「保存并应用」。'); })
    .catch((error) => {
      warn(error.message || '读取配置失败。');
      say(error.message || '读取配置失败。', true);
    });
})();
`;
