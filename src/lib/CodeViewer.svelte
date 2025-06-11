<script>
  import { onMount, afterUpdate } from 'svelte';
  import Prism from 'prismjs';
  
  export let code = '';
  export let errors = []; // { line: number, column: number, type: 'error' | 'warning', message: string }[]
  
  let codeElement;
  let selectedTheme = 'tomorrow';
  let codeLines = [];
  
  // テーマの選択肢
  const themes = [
    { value: 'tomorrow', label: 'Tomorrow Night', file: 'prism-tomorrow.css' },
    { value: 'okaidia', label: 'Okaidia', file: 'prism-okaidia.css' },
    { value: 'twilight', label: 'Twilight', file: 'prism-twilight.css' },
    { value: 'prism', label: 'Default', file: 'prism.css' },
    { value: 'solarizedlight', label: 'Solarized Light', file: 'prism-solarizedlight.css' },
    { value: 'coy', label: 'Coy', file: 'prism-coy.css' },
    { value: 'dark', label: 'Dark', file: 'prism-dark.css' },
    { value: 'funky', label: 'Funky', file: 'prism-funky.css' }
  ];
  
  // エラー行のマップを作成
  $: errorMap = errors.reduce((map, error) => {
    if (!map[error.line]) {
      map[error.line] = [];
    }
    map[error.line].push(error);
    return map;
  }, {});
  
  // コードを行ごとに分割
  $: {
    if (code) {
      codeLines = code.split('\n');
    } else {
      codeLines = [];
    }
  }
  
  // 動的にテーマを読み込む
  function loadTheme(themeName) {
    // 既存のPrismテーマを削除
    const existingTheme = document.getElementById('prism-theme');
    if (existingTheme) {
      existingTheme.remove();
    }
    
    // 新しいテーマを読み込む
    const theme = themes.find(t => t.value === themeName);
    if (theme) {
      const link = document.createElement('link');
      link.id = 'prism-theme';
      link.rel = 'stylesheet';
      link.href = `https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/${theme.file}`;
      document.head.appendChild(link);
      
      // テーマ読み込み後、コードを再ハイライト
      setTimeout(() => {
        highlightCode();
      }, 100);
    }
  }
  
  // テーマ変更時の処理
  function onThemeChange() {
    loadTheme(selectedTheme);
    // ローカルストレージに保存（Tauri環境では使えないので、将来的にはTauriのストレージAPIを使用）
    try {
      localStorage.setItem('nqc-code-theme', selectedTheme);
    } catch (e) {
      // Tauri環境では無視
    }
  }
  
  // NQC特有のキーワードを追加
  const nqcKeywords = {
    functions: [
      'On', 'Off', 'OnFwd', 'OnFor', 'OnRev', 'Fwd', 'Rev', 'Toggle',
      'SetPower', 'SetDirection', 'SetOutput',
      'SetSensor', 'SetSensorType', 'SetSensorMode', 'ClearSensor',
      'SensorValue', 'SensorType', 'SensorMode', 'SensorValueBool', 'SensorValueRaw',
      'PlaySound', 'PlayTone', 'MuteSound',
      'Wait', 'StopAllTasks',
      'Timer', 'ClearTimer', 'SetTimer', 'FastTimer',
      'CreateDatalog', 'AddToDatalog', 'UploadDatalog',
      'Random', 'SetRandomSeed',
      'Message', 'ClearMessage', 'SendMessage',
      'SetTxPower', 'SetDisplay', 'SetWatch',
      'SetSleepTime', 'SleepNow', 'StopAllTasks',
      'Float', 'Acquire', 'Release', 'Catch', 'Monitor'
    ],
    keywords: ['task', 'start', 'stop', 'abs', 'sign', 'acquire', 'catch', 'monitor', 'sub'],
    constants: [
      'OUT_A', 'OUT_B', 'OUT_C',
      'OUT_LOW', 'OUT_HALF', 'OUT_FULL',
      'OUT_FWD', 'OUT_REV', 'OUT_TOGGLE', 'OUT_OFF', 'OUT_ON', 'OUT_FLOAT',
      'SENSOR_1', 'SENSOR_2', 'SENSOR_3',
      'SENSOR_TOUCH', 'SENSOR_LIGHT', 'SENSOR_ROTATION',
      'SENSOR_CELSIUS', 'SENSOR_FAHRENHEIT', 'SENSOR_PULSE', 'SENSOR_EDGE',
      'SENSOR_MODE_RAW', 'SENSOR_MODE_BOOL', 'SENSOR_MODE_EDGE',
      'SENSOR_MODE_PULSE', 'SENSOR_MODE_PERCENT', 'SENSOR_MODE_CELSIUS',
      'SENSOR_MODE_FAHRENHEIT', 'SENSOR_MODE_ROTATION',
      'SOUND_CLICK', 'SOUND_DOUBLE_BEEP', 'SOUND_DOWN',
      'SOUND_UP', 'SOUND_LOW_BEEP', 'SOUND_FAST_UP',
      'DISPLAY_WATCH', 'DISPLAY_SENSOR_1', 'DISPLAY_SENSOR_2', 'DISPLAY_SENSOR_3',
      'DISPLAY_OUT_A', 'DISPLAY_OUT_B', 'DISPLAY_OUT_C',
      'TX_POWER_LO', 'TX_POWER_HI'
    ]
  };
  
  // カスタムトークンを定義
  function extendPrismForNQC() {
    if (!Prism.languages.c) {
      // C言語のサポートを読み込む
      import('prismjs/components/prism-c');
    }
    
    // NQC言語定義
    Prism.languages.nqc = {
      'comment': {
        pattern: /(^|[^\\])\/\*[\s\S]*?(?:\*\/|$)|\/\/.*/,
        lookbehind: true,
        greedy: true
      },
      'string': {
        pattern: /"(?:\\.|[^"\\])*"/,
        greedy: true
      },
      'preprocessor': {
        pattern: /(^[\t ]*)#.*/m,
        lookbehind: true,
        inside: {
          'directive': /^#\w+/,
          'string': /"(?:\\.|[^"\\])*"/,
          'comment': /\/\*[\s\S]*?\*\/|\/\/.*/
        }
      },
      'task-definition': {
        pattern: /\b(?:task|sub)\s+[\w_]+\s*\(/,
        inside: {
          'keyword': /\b(?:task|sub)\b/,
          'function': /[\w_]+(?=\s*\()/,
          'punctuation': /\(/  // 括弧を明示的に処理
        }
      },
      'keyword': new RegExp(
        `\\b(?:${[
          // C keywords
          'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'default',
          'break', 'continue', 'return', 'goto', 'void', 'int', 'char',
          'float', 'double', 'long', 'short', 'unsigned', 'signed',
          'const', 'static', 'extern', 'auto', 'register', 'sizeof',
          'typedef', 'union', 'struct', 'enum', 'inline',
          // NQC keywords
          ...nqcKeywords.keywords
        ].join('|')})\\b`
      ),
      'boolean': /\b(?:true|false)\b/,
      'function': new RegExp(
        `\\b(?:${nqcKeywords.functions.join('|')})(?=\\s*\\()`
      ),
      'constant': new RegExp(
        `\\b(?:${nqcKeywords.constants.join('|')})\\b`
      ),
      'builtin': /\b(?:SENSOR_\d+|pow|sqrt|abs|sign)\b/,
      'number': /(?:\b0x(?:[\da-f]+(?:\.[\da-f]*)?|\.[\da-f]+)(?:p[+-]?\d+)?|(?:\b\d+(?:\.\d*)?|\B\.\d+)(?:e[+-]?\d+)?)[ful]*/i,
      'operator': /--?|\+\+?|!=?|<<=?|>>=?|==?|&&?|\|\|?|[?:~]|[*\/%+\-<>=&|^!]/,
      'punctuation': /[{}[\];(),.:]/,
      'variable': /\b[a-zA-Z_]\w*(?=\s*[=+\-*/])/
    };
    
    // 変数への代入を特別に処理
    Prism.languages.insertBefore('nqc', 'operator', {
      'assignment': {
        pattern: /(\w+)\s*(=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=)/,
        inside: {
          'variable': /^\w+/,
          'operator': /=|\+=|-=|\*=|\/=|%=|&=|\|=|\^=|<<=|>>=/
        }
      }
    });
  }
  
  onMount(() => {
    // 保存されたテーマを読み込む
    try {
      const savedTheme = localStorage.getItem('nqc-code-theme');
      if (savedTheme && themes.some(t => t.value === savedTheme)) {
        selectedTheme = savedTheme;
      }
    } catch (e) {
      // Tauri環境では無視
    }
    
    // C言語のサポートを先に読み込む
    import('prismjs/components/prism-c').then(() => {
      extendPrismForNQC();
      loadTheme(selectedTheme);
      highlightCode();
    });
  });
  
  afterUpdate(() => {
    highlightCode();
  });
  
  function highlightCode() {
    if (codeElement) {
      // 各行を個別にハイライト
      const highlightedLines = codeLines.map((line, index) => {
        const tempElement = document.createElement('code');
        tempElement.className = 'language-nqc';
        tempElement.textContent = line || ' '; // 空行の場合はスペースを入れる
        Prism.highlightElement(tempElement);
        return tempElement.innerHTML;
      });
      
      codeElement.innerHTML = highlightedLines.map((highlightedLine, index) => {
        const lineNumber = index + 1;
        const lineErrors = errorMap[lineNumber] || [];
        const errorClass = lineErrors.some(e => e.type === 'error') ? 'error-line' : 
                          lineErrors.some(e => e.type === 'warning') ? 'warning-line' : '';
        
        let errorIndicator = '';
        if (lineErrors.length > 0) {
          const errorMessages = lineErrors.map(e => `${e.type}: ${e.message}`).join('\n');
          errorIndicator = `<span class="error-indicator ${lineErrors[0].type}" title="${errorMessages}">●</span>`;
        }
        
        return `<div class="code-line ${errorClass}" data-line="${lineNumber}">${errorIndicator}<span class="line-content">${highlightedLine}</span></div>`;
      }).join('');
    }
  }
  
  // 行番号を生成
  $: lineNumbers = codeLines.map((_, i) => i + 1);
  
  // コードをコピー
  function copyCode() {
    navigator.clipboard.writeText(code);
  }
  
  // エラー行にスクロール
  function scrollToError() {
    if (errors.length > 0) {
      const firstError = errors[0];
      const errorElement = codeElement?.querySelector(`[data-line="${firstError.line}"]`);
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }
</script>

<div class="code-viewer theme-{selectedTheme}">
  <div class="code-toolbar">
    <div class="toolbar-left">
      <select bind:value={selectedTheme} on:change={onThemeChange} class="theme-selector">
        <optgroup label="ダークテーマ">
          {#each themes.filter(t => ['tomorrow', 'okaidia', 'twilight', 'dark', 'funky'].includes(t.value)) as theme}
            <option value={theme.value}>{theme.label}</option>
          {/each}
        </optgroup>
        <optgroup label="ライトテーマ">
          {#each themes.filter(t => ['prism', 'solarizedlight', 'coy'].includes(t.value)) as theme}
            <option value={theme.value}>{theme.label}</option>
          {/each}
        </optgroup>
      </select>
      {#if errors.length > 0}
        <button class="error-jump-button" on:click={scrollToError} title="最初のエラーへジャンプ">
          ⚠️ エラー: {errors.length}件
        </button>
      {/if}
    </div>
    <div class="toolbar-right">
      <button class="copy-button" on:click={copyCode} title="コードをコピー">
        📋 コピー
      </button>
    </div>
  </div>
  <div class="code-content-wrapper">
    <div class="line-numbers" class:light-theme={['prism', 'solarizedlight', 'coy'].includes(selectedTheme)}>
      {#each lineNumbers as lineNumber}
        <div class="line-number" class:error={errorMap[lineNumber]?.some(e => e.type === 'error')} 
             class:warning={errorMap[lineNumber]?.some(e => e.type === 'warning')}>
          {lineNumber}
        </div>
      {/each}
    </div>
    <pre class="code-content"><code bind:this={codeElement} class="language-nqc"></code></pre>
  </div>
</div>

<style>
  .code-viewer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background-color: #2d2d2d;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 14px;
  }
  
  /* ライトテーマ用の背景色調整 */
  .code-viewer.theme-prism,
  .code-viewer.theme-solarizedlight,
  .code-viewer.theme-coy {
    background-color: #f5f5f5;
  }
  
  .code-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem;
    background-color: #252525;
    border-bottom: 1px solid #3a3a3a;
    flex-shrink: 0;
  }
  
  .code-viewer.theme-prism .code-toolbar,
  .code-viewer.theme-solarizedlight .code-toolbar,
  .code-viewer.theme-coy .code-toolbar {
    background-color: #e8e8e8;
    border-bottom-color: #d0d0d0;
  }
  
  .toolbar-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .toolbar-right {
    display: flex;
    align-items: center;
  }
  
  .theme-selector {
    padding: 0.25rem 0.5rem;
    background-color: #3a3a3a;
    color: #d4d4d4;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
  }
  
  .code-viewer.theme-prism .theme-selector,
  .code-viewer.theme-solarizedlight .theme-selector,
  .code-viewer.theme-coy .theme-selector {
    background-color: #ffffff;
    color: #333333;
    border-color: #cccccc;
  }
  
  .theme-selector:hover {
    background-color: #4a4a4a;
    border-color: #5a5a5a;
  }
  
  .code-viewer.theme-prism .theme-selector:hover,
  .code-viewer.theme-solarizedlight .theme-selector:hover,
  .code-viewer.theme-coy .theme-selector:hover {
    background-color: #f0f0f0;
    border-color: #bbbbbb;
  }
  
  .error-jump-button {
    padding: 0.25rem 0.75rem;
    background-color: #d32f2f;
    color: #ffffff;
    border: 1px solid #b71c1c;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .error-jump-button:hover {
    background-color: #b71c1c;
    border-color: #8b0000;
  }
  
  .copy-button {
    padding: 0.25rem 0.75rem;
    background-color: #3a3a3a;
    color: #d4d4d4;
    border: 1px solid #4a4a4a;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .code-viewer.theme-prism .copy-button,
  .code-viewer.theme-solarizedlight .copy-button,
  .code-viewer.theme-coy .copy-button {
    background-color: #ffffff;
    color: #333333;
    border-color: #cccccc;
  }
  
  .copy-button:hover {
    background-color: #4a4a4a;
    border-color: #5a5a5a;
  }
  
  .code-viewer.theme-prism .copy-button:hover,
  .code-viewer.theme-solarizedlight .copy-button:hover,
  .code-viewer.theme-coy .copy-button:hover {
    background-color: #f0f0f0;
    border-color: #bbbbbb;
  }
  
  .code-content-wrapper {
    display: flex;
    flex: 1;
    overflow: auto;
    min-height: 0;
  }
  
  .line-numbers {
    flex-shrink: 0;
    padding: 1rem 0.5rem;
    background-color: #252525;
    color: #636363;
    text-align: right;
    user-select: none;
    border-right: 1px solid #3a3a3a;
    line-height: 1.5;
    font-size: 14px;
  }
  
  .line-numbers.light-theme {
    background-color: #f0f0f0;
    color: #999999;
    border-right-color: #d0d0d0;
  }
  
  .line-number {
    padding: 0;
    margin: 0;
    position: relative;
  }
  
  .line-number.error {
    color: #ff5252;
    font-weight: bold;
  }
  
  .line-number.warning {
    color: #ffc107;
    font-weight: bold;
  }
  
  .code-content {
    flex: 1;
    margin: 0;
    padding: 1rem;
    overflow: visible;
    line-height: 1.5;
    font-size: 14px;
    background-color: transparent !important;
  }
  
  .code-content code {
    display: block;
    color: #d4d4d4;
    line-height: inherit;
    font-size: inherit;
    font-family: inherit;
    background: transparent !important;
  }
  
  /* コード行のスタイル */
  :global(.code-line) {
    position: relative;
    padding-left: 1.5rem;
    line-height: 1.5;
  }
  
  :global(.code-line.error-line) {
    background-color: rgba(255, 82, 82, 0.1);
    border-left: 3px solid #ff5252;
    margin-left: -3px;
  }
  
  :global(.code-line.warning-line) {
    background-color: rgba(255, 193, 7, 0.1);
    border-left: 3px solid #ffc107;
    margin-left: -3px;
  }
  
  :global(.error-indicator) {
    position: absolute;
    left: 0.25rem;
    font-size: 12px;
    cursor: help;
  }
  
  :global(.error-indicator.error) {
    color: #ff5252;
  }
  
  :global(.error-indicator.warning) {
    color: #ffc107;
  }
  
  :global(.line-content) {
    display: inline-block;
  }
  
  /* ライトテーマでのエラーハイライト調整 */
  .code-viewer.theme-prism :global(.code-line.error-line),
  .code-viewer.theme-solarizedlight :global(.code-line.error-line),
  .code-viewer.theme-coy :global(.code-line.error-line) {
    background-color: rgba(255, 82, 82, 0.15);
  }
  
  .code-viewer.theme-prism :global(.code-line.warning-line),
  .code-viewer.theme-solarizedlight :global(.code-line.warning-line),
  .code-viewer.theme-coy :global(.code-line.warning-line) {
    background-color: rgba(255, 193, 7, 0.15);
  }
  
  /* Prism.jsのデフォルトスタイルをオーバーライド */
  :global(.code-viewer pre[class*="language-"]) {
    margin: 0;
    padding: 0;
    overflow: visible;
    background: transparent;
    line-height: inherit;
  }
  
  :global(.code-viewer code[class*="language-"]) {
    line-height: inherit;
    font-size: inherit;
  }
  
  /* スクロールバーのスタイリング */
  .code-viewer::-webkit-scrollbar,
  .code-content-wrapper::-webkit-scrollbar {
    width: 12px;
    height: 12px;
  }
  
  .code-viewer::-webkit-scrollbar-track,
  .code-content-wrapper::-webkit-scrollbar-track {
    background: #1e1e1e;
  }
  
  .code-viewer.theme-prism ::-webkit-scrollbar-track,
  .code-viewer.theme-solarizedlight ::-webkit-scrollbar-track,
  .code-viewer.theme-coy ::-webkit-scrollbar-track {
    background: #f0f0f0;
  }
  
  .code-viewer::-webkit-scrollbar-thumb,
  .code-content-wrapper::-webkit-scrollbar-thumb {
    background: #4a4a4a;
    border-radius: 6px;
  }
  
  .code-viewer.theme-prism ::-webkit-scrollbar-thumb,
  .code-viewer.theme-solarizedlight ::-webkit-scrollbar-thumb,
  .code-viewer.theme-coy ::-webkit-scrollbar-thumb {
    background: #cccccc;
  }
  
  .code-viewer::-webkit-scrollbar-thumb:hover,
  .code-content-wrapper::-webkit-scrollbar-thumb:hover {
    background: #5a5a5a;
  }
  
  .code-viewer.theme-prism ::-webkit-scrollbar-thumb:hover,
  .code-viewer.theme-solarizedlight ::-webkit-scrollbar-thumb:hover,
  .code-viewer.theme-coy ::-webkit-scrollbar-thumb:hover {
    background: #bbbbbb;
  }
  
  /* 選択時のハイライト */
  .code-content ::selection {
    background-color: #3a4556;
  }
  
  .code-content ::-moz-selection {
    background-color: #3a4556;
  }
  
  .code-viewer.theme-prism .code-content ::selection,
  .code-viewer.theme-solarizedlight .code-content ::selection,
  .code-viewer.theme-coy .code-content ::selection {
    background-color: #b3d4fc;
  }
</style>
