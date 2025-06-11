<script>
  import { onMount } from 'svelte';
  import { invoke } from '@tauri-apps/api/core';
  import { message, open, save, confirm } from '@tauri-apps/plugin-dialog';
  import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
  import BlocklyWorkspace from './lib/BlocklyWorkspace.svelte';
  import CodeViewer from './lib/CodeViewer.svelte';
  import SystemTools from './lib/SystemTools.svelte';
  
  let activeTab = 'programming'; // 'programming' or 'system'
  let blocklyWorkspace;
  let generatedCode = '';
  let serialPorts = [];
  let selectedPort = '';
  let nqcPath = 'nqc';
  let targetType = 'RCX';
  let programSlot = 1;
  let connectionStatus = false;
  let codeErrors = [];

  onMount(async () => {
    await loadSerialPorts();
  });

  async function loadSerialPorts() {
    try {
      serialPorts = await invoke('get_serial_ports');
      if (serialPorts.length > 0 && !selectedPort) {
        selectedPort = serialPorts[0].path;
      }
    } catch (error) {
      console.error('Load serial ports error:', error);
      await message(`シリアルポートの取得エラー: ${error}`, { 
        title: 'エラー', 
        kind: 'error' 
      });
    }
  }

  function handleCodeUpdate(event) {
    generatedCode = event.detail.code;
    // コードが更新されたらエラーをクリア
    codeErrors = [];
  }

  async function compileCode() {
    try {
      const result = await invoke('compile_nqc', {
        nqcPath,
        code: generatedCode,
        serialPort: selectedPort,
        targetType
      });

      if (result.success) {
        codeErrors = []; // エラーをクリア
        await message('コンパイル成功', { 
          title: '成功', 
          kind: 'info' 
        });
      } else {
        // エラーを解析
        codeErrors = parseNqcErrors(result.stderr);
        await message(`コンパイルエラー:\n${result.stderr}`, { 
          title: 'エラー', 
          kind: 'error' 
        });
      }
    } catch (error) {
      console.error('Compile error:', error);
      await message(`コンパイルエラー: ${error}`, { 
        title: 'エラー', 
        kind: 'error' 
      });
    }
  }
  
  function parseNqcErrors(stderr) {
    const lines = stderr.split('\n');
    const errors = [];
    const errorPattern = /^(.+\.nqc):(\d+):(\d+):\s*(error|warning):\s*(.+)$/;
    
    for (const line of lines) {
      const match = line.match(errorPattern);
      if (match) {
        errors.push({
          filename: match[1],
          line: parseInt(match[2]),
          column: parseInt(match[3]),
          type: match[4],
          message: match[5]
        });
      }
    }
    
    return errors;
  }

  async function downloadToRCX() {
    try {
      const result = await invoke('download_to_rcx', {
        nqcPath,
        code: generatedCode,
        serialPort: selectedPort,
        targetType,
        programSlot
      });

      if (result.success) {
        connectionStatus = true;
        codeErrors = []; // 転送成功時はエラーをクリア
        await message('RCXへの転送成功', { 
          title: '成功', 
          kind: 'info' 
        });
      } else {
        // エラーを解析
        codeErrors = parseNqcErrors(result.stderr);
        await message(`転送エラー:\n${result.stderr}`, { 
          title: 'エラー', 
          kind: 'error' 
        });
      }
    } catch (error) {
      console.error('Download error:', error);
      await message(`転送エラー: ${error}`, { 
        title: 'エラー', 
        kind: 'error' 
      });
    }
  }

  async function controlRCX(action) {
    try {
      const result = await invoke('control_rcx', {
        nqcPath,
        serialPort: selectedPort,
        action
      });

      if (result.success) {
        await message(`${action}コマンド実行成功`, { 
          title: '成功', 
          kind: 'info' 
        });
      } else {
        await message(`実行エラー:\n${result.stderr}`, { 
          title: 'エラー', 
          kind: 'error' 
        });
      }
    } catch (error) {
      console.error('Control RCX error:', error);
      await message(`実行エラー: ${error}`, { 
        title: 'エラー', 
        kind: 'error' 
      });
    }
  }

  async function saveProject() {
    try {
      const filePath = await save({
        filters: [{
          name: 'NQC Project',
          extensions: ['nqcproj']
        }],
        defaultPath: 'project.nqcproj'
      });
      
      if (filePath) {
        const projectData = {
          version: '1.0',
          workspace: blocklyWorkspace.getWorkspaceXml(),
          nqcCode: generatedCode,
          settings: {
            nqcPath,
            targetType,
            selectedPort
          }
        };
        
        await writeTextFile(filePath, JSON.stringify(projectData, null, 2));
        await message('プロジェクトを保存しました', { 
          title: '成功', 
          kind: 'info' 
        });
      }
    } catch (error) {
      console.error('Save project error:', error);
      await message(`保存エラー: ${error}`, { 
        title: 'エラー', 
        kind: 'error' 
      });
    }
  }

  async function loadProject() {
    try {
      const filePath = await open({
        multiple: false,
        filters: [{
          name: 'NQC Project',
          extensions: ['nqcproj']
        }]
      });
      
      if (filePath) {
        const content = await readTextFile(filePath);
        const projectData = JSON.parse(content);
        
        blocklyWorkspace.loadWorkspaceXml(projectData.workspace);
        
        if (projectData.settings) {
          nqcPath = projectData.settings.nqcPath || nqcPath;
          targetType = projectData.settings.targetType || targetType;
          selectedPort = projectData.settings.selectedPort || selectedPort;
        }
        
        codeErrors = []; // プロジェクト読み込み時はエラーをクリア
        
        await message('プロジェクトを読み込みました', { 
          title: '成功', 
          kind: 'info' 
        });
      }
    } catch (error) {
      console.error('Load project error:', error);
      await message(`読み込みエラー: ${error}`, { 
        title: 'エラー', 
        kind: 'error' 
      });
    }
  }

  async function exportNqcCode() {
    try {
      const filePath = await save({
        filters: [{
          name: 'NQC Source',
          extensions: ['nqc']
        }],
        defaultPath: 'program.nqc'
      });
      
      if (filePath) {
        await writeTextFile(filePath, generatedCode);
        await message('NQCコードをエクスポートしました', { 
          title: '成功', 
          kind: 'info' 
        });
      }
    } catch (error) {
      console.error('Export error:', error);
      await message(`エクスポートエラー: ${error}`, { 
        title: 'エラー', 
        kind: 'error' 
      });
    }
  }

  async function clearWorkspace() {
    try {
      const confirmed = await confirm('ワークスペースをクリアしますか？', {
        title: '確認',
        kind: 'warning'
      });
      
      if (confirmed) {
        blocklyWorkspace.clearWorkspace();
        codeErrors = []; // エラーもクリア
      }
    } catch (error) {
      console.error('Clear workspace error:', error);
    }
  }
</script>

<main>
  <header>
    <div class="header-content">
      <h1>🧱 NQC Blockly IDE for LEGO RCX</h1>
      <div class="connection-indicator">
        <span class="connection-status" class:connected={connectionStatus}>
          <span class="status-dot"></span>
          {connectionStatus ? '接続済み' : '未接続'}
        </span>
      </div>
    </div>
    
    <div class="tab-container">
      <div class="tabs">
        <button 
          class="tab" 
          class:active={activeTab === 'programming'}
          on:click={() => activeTab = 'programming'}
        >
          <span class="tab-icon">📝</span>
          <span class="tab-text">プログラミング</span>
          <span class="tab-indicator"></span>
        </button>
        <button 
          class="tab" 
          class:active={activeTab === 'system'}
          on:click={() => activeTab = 'system'}
        >
          <span class="tab-icon">⚙️</span>
          <span class="tab-text">システムツール</span>
          <span class="tab-indicator"></span>
        </button>
      </div>
    </div>
  </header>

  <div class="content-area">
    {#if activeTab === 'programming'}
      <nav class="toolbar">
        <div class="toolbar-section">
          <span class="section-label">ファイル:</span>
          <button on:click={clearWorkspace}>クリア</button>
          <button on:click={saveProject}>保存</button>
          <button on:click={loadProject}>読み込み</button>
          <button on:click={exportNqcCode}>NQCエクスポート</button>
        </div>
        
        <div class="toolbar-section">
          <span class="section-label">サンプル:</span>
          <button on:click={() => blocklyWorkspace.loadSample(1)} class="sample-button">
            タッチセンサー
          </button>
          <button on:click={() => blocklyWorkspace.loadSample(2)} class="sample-button">
            ライントレース
          </button>
          <button on:click={() => blocklyWorkspace.loadSample(3)} class="sample-button">
            音楽演奏
          </button>
          <button on:click={() => blocklyWorkspace.loadSample(4)} class="sample-button">
            データログ
          </button>
        </div>
        
        <div class="toolbar-section">
          <span class="section-label">実行制御:</span>
          <button on:click={compileCode}>コンパイル</button>
          <button on:click={downloadToRCX} class="primary">🚀 RCXに転送</button>
          <button on:click={() => controlRCX('run')}>実行</button>
          <button on:click={() => controlRCX('stop')}>停止</button>
          <button on:click={() => controlRCX('clear')} class="danger">クリア</button>
          
          <span class="section-label">接続設定:</span>
          <select bind:value={selectedPort}>
            {#each serialPorts as port}
              <option value={port.path}>{port.name}</option>
            {/each}
          </select>
          
          <select bind:value={targetType}>
            <option value="RCX">RCX</option>
            <option value="RCX2">RCX2</option>
            <option value="CM">CyberMaster</option>
            <option value="Scout">Scout</option>
          </select>
          
          <select bind:value={programSlot}>
            <option value={1}>スロット 1</option>
            <option value={2}>スロット 2</option>
            <option value={3}>スロット 3</option>
            <option value={4}>スロット 4</option>
            <option value={5}>スロット 5</option>
          </select>
        </div>
      </nav>

      <div class="workspace-container">
        <BlocklyWorkspace 
          bind:this={blocklyWorkspace}
          on:codeUpdate={handleCodeUpdate}
        />
        
        <aside class="code-panel">
          <div class="code-header">
            <h3>生成されたNQCコード</h3>
          </div>
          <CodeViewer code={generatedCode} errors={codeErrors} />
        </aside>
      </div>
    {:else if activeTab === 'system'}
      <div class="system-tools-container">
        <SystemTools 
          {nqcPath} 
          {selectedPort}
        />
      </div>
    {/if}
  </div>
  
  <footer>
    <div class="settings">
      <label>
        NQCパス:
        <input type="text" bind:value={nqcPath} />
      </label>
      <label>
        シリアルポート:
        <select bind:value={selectedPort}>
          {#each serialPorts as port}
            <option value={port.path}>{port.name}</option>
          {/each}
        </select>
      </label>
    </div>
  </footer>
</main>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background-color: #f5f5f5;
  }
  
  main {
    display: flex;
    flex-direction: column;
    height: 100vh;
  }
  
  header {
    background-color: #1e2329;
    color: white;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .header-content {
    padding: 0.75rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  h1 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 600;
  }
  
  .connection-indicator {
    display: flex;
    align-items: center;
  }
  
  .connection-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.4rem 0.8rem;
    border-radius: 20px;
    background-color: rgba(255, 255, 255, 0.1);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.3s ease;
  }
  
  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #dc3545;
    transition: all 0.3s ease;
  }
  
  .connection-status.connected {
    background-color: rgba(40, 167, 69, 0.2);
  }
  
  .connection-status.connected .status-dot {
    background-color: #28a745;
    box-shadow: 0 0 0 2px rgba(40, 167, 69, 0.3);
  }
  
  /* タブコンテナ */
  .tab-container {
    background-color: #2b303b;
    padding: 0 1.5rem;
  }
  
  .tabs {
    display: flex;
    gap: 0.25rem;
    height: 44px;
    align-items: flex-end;
  }
  
  /* タブのスタイル */
  .tab {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background-color: transparent;
    color: rgba(255, 255, 255, 0.7);
    border: none;
    border-radius: 8px 8px 0 0;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
    height: 40px;
    margin-bottom: 0;
  }
  
  .tab:hover:not(.active) {
    background-color: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.9);
  }
  
  .tab.active {
    background-color: #f5f5f5;
    color: #2b303b;
    font-weight: 600;
  }
  
  .tab-icon {
    font-size: 1.1rem;
    line-height: 1;
  }
  
  .tab-text {
    position: relative;
  }
  
  /* タブインジケーター */
  .tab-indicator {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    background-color: transparent;
    transition: all 0.3s ease;
  }
  
  .tab.active .tab-indicator {
    background-color: #3498db;
  }
  
  /* コンテンツエリア */
  .content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background-color: #f5f5f5;
    overflow: hidden;
  }
  
  .toolbar {
    background-color: #ffffff;
    padding: 0.75rem 1rem;
    display: flex;
    gap: 2rem;
    flex-wrap: wrap;
    border-bottom: 1px solid #e0e0e0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .toolbar-section {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 6px;
    background-color: #f0f0f0;
    color: #333;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }
  
  button:hover {
    background-color: #e0e0e0;
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  button:active {
    transform: translateY(0);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }
  
  button.primary {
    background-color: #3498db;
    color: white;
  }
  
  button.primary:hover {
    background-color: #2980b9;
  }
  
  button.danger {
    background-color: #e74c3c;
    color: white;
  }
  
  button.danger:hover {
    background-color: #c0392b;
  }
  
  .sample-button {
    background-color: #9b59b6;
    color: white;
  }
  
  .sample-button:hover {
    background-color: #8e44ad;
  }
  
  select, input[type="text"] {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 6px;
    font-size: 0.9rem;
    background-color: white;
    transition: border-color 0.2s ease;
  }
  
  select:hover, input[type="text"]:hover {
    border-color: #bbb;
  }
  
  select:focus, input[type="text"]:focus {
    outline: none;
    border-color: #3498db;
    box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
  }
  
  .workspace-container {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
  
  .system-tools-container {
    flex: 1;
    overflow: hidden;
  }
  
  .code-panel {
    width: 400px;
    background-color: #2b2b2b;
    display: flex;
    flex-direction: column;
    border-left: 1px solid #ddd;
  }
  
  .code-header {
    background-color: #3c3c3c;
    color: white;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #555;
  }
  
  .code-header h3 {
    margin: 0;
    font-size: 1rem;
  }
  
  footer {
    background-color: #ffffff;
    padding: 0.75rem 1rem;
    border-top: 1px solid #e0e0e0;
    box-shadow: 0 -1px 3px rgba(0, 0, 0, 0.05);
  }
  
  .settings {
    display: flex;
    gap: 1rem;
    align-items: center;
  }
  
  .settings label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    color: #555;
  }
  
  .section-label {
    font-weight: 600;
    color: #666;
    margin-right: 0.5rem;
    font-size: 0.9rem;
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 1200px) {
    .code-panel {
      width: 350px;
    }
  }
  
  @media (max-width: 768px) {
    .header-content {
      flex-direction: column;
      gap: 0.5rem;
      align-items: flex-start;
    }
    
    .tabs {
      gap: 0;
    }
    
    .tab {
      padding: 0.5rem 1rem;
      font-size: 0.85rem;
    }
    
    .toolbar {
      gap: 1rem;
    }
    
    .toolbar-section {
      flex-wrap: wrap;
    }
  }
</style>
