<script>
  import { invoke } from '@tauri-apps/api/core';
  import { message, open } from '@tauri-apps/plugin-dialog';
  
  export let nqcPath;
  export let selectedPort;
  
  let firmwarePath = '';
  let batteryLevel = '';
  let currentTime = new Date().toTimeString().slice(0, 5);
  let programSlots = '';
  let memoryMap = '';
  let datalog = '';
  let isLoading = false;
  
  async function selectFirmware() {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'LEGO Firmware',
        extensions: ['lgo']
      }]
    });
    
    if (selected) {
      firmwarePath = selected;
    }
  }
  
  async function downloadFirmware() {
    if (!firmwarePath) {
      await message('ファームウェアファイルを選択してください', {
        title: 'エラー',
        kind: 'error'
      });
      return;
    }
    
    isLoading = true;
    try {
      const result = await invoke('download_firmware', {
        nqcPath,
        firmwarePath,
        serialPort: selectedPort
      });
      
      if (result.success) {
        await message('ファームウェアのダウンロードが完了しました', {
          title: '成功',
          kind: 'info'
        });
      } else {
        await message(`ファームウェアダウンロードエラー:\n${result.stderr}`, {
          title: 'エラー',
          kind: 'error'
        });
      }
    } catch (error) {
      await message(`エラー: ${error}`, {
        title: 'エラー',
        kind: 'error'
      });
    } finally {
      isLoading = false;
    }
  }
  
  async function getBatteryLevel() {
    isLoading = true;
    try {
      const result = await invoke('get_battery_level', {
        nqcPath,
        serialPort: selectedPort
      });
      
      if (result.success) {
        // NQCの出力からバッテリー電圧を抽出
        const match = result.stdout.match(/Battery Level: ([\d.]+)V/);
        if (match) {
          batteryLevel = match[1] + ' V';
        } else {
          batteryLevel = result.stdout.trim();
        }
      } else {
        await message(`バッテリー情報取得エラー:\n${result.stderr}`, {
          title: 'エラー',
          kind: 'error'
        });
      }
    } catch (error) {
      await message(`エラー: ${error}`, {
        title: 'エラー',
        kind: 'error'
      });
    } finally {
      isLoading = false;
    }
  }
  
  async function setRCXTime() {
    isLoading = true;
    try {
      const result = await invoke('set_rcx_time', {
        nqcPath,
        serialPort: selectedPort,
        time: currentTime
      });
      
      if (result.success) {
        await message('RCXの時刻を設定しました', {
          title: '成功',
          kind: 'info'
        });
      } else {
        await message(`時刻設定エラー:\n${result.stderr}`, {
          title: 'エラー',
          kind: 'error'
        });
      }
    } catch (error) {
      await message(`エラー: ${error}`, {
        title: 'エラー',
        kind: 'error'
      });
    } finally {
      isLoading = false;
    }
  }
  
  async function uploadDatalog() {
    isLoading = true;
    try {
      const result = await invoke('upload_datalog', {
        nqcPath,
        serialPort: selectedPort
      });
      
      if (result.success) {
        datalog = result.stdout;
      } else {
        await message(`データログアップロードエラー:\n${result.stderr}`, {
          title: 'エラー',
          kind: 'error'
        });
      }
    } catch (error) {
      await message(`エラー: ${error}`, {
        title: 'エラー',
        kind: 'error'
      });
    } finally {
      isLoading = false;
    }
  }
  
  async function getProgramSlots() {
    isLoading = true;
    try {
      const result = await invoke('get_program_slots', {
        nqcPath,
        serialPort: selectedPort
      });
      
      if (result.success) {
        programSlots = result.stdout;
      } else {
        await message(`プログラムスロット情報取得エラー:\n${result.stderr}`, {
          title: 'エラー',
          kind: 'error'
        });
      }
    } catch (error) {
      await message(`エラー: ${error}`, {
        title: 'エラー',
        kind: 'error'
      });
    } finally {
      isLoading = false;
    }
  }
  
  async function getMemoryMap() {
    isLoading = true;
    try {
      const result = await invoke('get_memory_map', {
        nqcPath,
        serialPort: selectedPort
      });
      
      if (result.success) {
        memoryMap = result.stdout;
      } else {
        await message(`メモリマップ取得エラー:\n${result.stderr}`, {
          title: 'エラー',
          kind: 'error'
        });
      }
    } catch (error) {
      await message(`エラー: ${error}`, {
        title: 'エラー',
        kind: 'error'
      });
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="system-tools">
  {#if isLoading}
    <div class="loading-overlay">
      <div class="loading-spinner"></div>
      <p>処理中...</p>
    </div>
  {/if}
  
  <div class="tools-grid">
    <!-- ファームウェアダウンロード -->
    <div class="tool-card">
      <div class="card-header">
        <h3>🔧 ファームウェア管理</h3>
      </div>
      <div class="tool-content">
        <p class="description">RCXファームウェアをダウンロードします。</p>
        <div class="firmware-selector">
          <input 
            type="text" 
            readonly 
            value={firmwarePath} 
            placeholder="ファームウェアファイル (.lgo)" 
            class="file-input"
          />
          <button on:click={selectFirmware} class="secondary">選択</button>
        </div>
        <button on:click={downloadFirmware} disabled={!firmwarePath || isLoading} class="primary full-width">
          ファームウェアをダウンロード
        </button>
      </div>
    </div>
    
    <!-- バッテリー情報 -->
    <div class="tool-card">
      <div class="card-header">
        <h3>🔋 バッテリー情報</h3>
      </div>
      <div class="tool-content">
        <p class="description">RCXのバッテリー電圧を確認します。</p>
        {#if batteryLevel}
          <div class="info-display">
            <span class="info-label">バッテリー電圧:</span>
            <span class="info-value">{batteryLevel}</span>
          </div>
        {/if}
        <button on:click={getBatteryLevel} disabled={isLoading} class="full-width">
          バッテリーレベルを取得
        </button>
      </div>
    </div>
    
    <!-- 時刻設定 -->
    <div class="tool-card">
      <div class="card-header">
        <h3>🕐 時刻設定</h3>
      </div>
      <div class="tool-content">
        <p class="description">RCXの内部時計を設定します。</p>
        <input type="time" bind:value={currentTime} class="time-input" />
        <button on:click={setRCXTime} disabled={isLoading} class="full-width">
          時刻を設定
        </button>
      </div>
    </div>
    
    <!-- プログラムスロット -->
    <div class="tool-card">
      <div class="card-header">
        <h3>📦 プログラムスロット</h3>
      </div>
      <div class="tool-content">
        <p class="description">プログラムスロットの使用状況を確認します。</p>
        {#if programSlots}
          <pre class="output-display">{programSlots}</pre>
        {/if}
        <button on:click={getProgramSlots} disabled={isLoading} class="full-width">
          スロット情報を取得
        </button>
      </div>
    </div>
    
    <!-- データログ -->
    <div class="tool-card">
      <div class="card-header">
        <h3>📊 データログ</h3>
      </div>
      <div class="tool-content">
        <p class="description">RCXからデータログをアップロードします。</p>
        {#if datalog}
          <pre class="output-display">{datalog}</pre>
        {/if}
        <button on:click={uploadDatalog} disabled={isLoading} class="full-width">
          データログをアップロード
        </button>
      </div>
    </div>
    
    <!-- メモリマップ -->
    <div class="tool-card">
      <div class="card-header">
        <h3>🗺️ メモリマップ</h3>
      </div>
      <div class="tool-content">
        <p class="description">RCXのメモリ使用状況を確認します。</p>
        {#if memoryMap}
          <pre class="output-display">{memoryMap}</pre>
        {/if}
        <button on:click={getMemoryMap} disabled={isLoading} class="full-width">
          メモリマップを取得
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .system-tools {
    position: relative;
    padding: 1.5rem;
    height: 100%;
    overflow-y: auto;
    background-color: var(--content-bg, #f5f5f5);
  }
  
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 100;
    color: white;
    backdrop-filter: blur(2px);
  }
  
  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 4px solid rgba(255, 255, 255, 0.3);
    border-top: 4px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .tools-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    gap: 1.5rem;
    max-width: 1400px;
    margin: 0 auto;
  }
  
  .tool-card {
    background-color: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
  }
  
  .tool-card:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
    transform: translateY(-2px);
  }
  
  .card-header {
    background-color: #f8f9fa;
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #e9ecef;
  }
  
  .card-header h3 {
    margin: 0;
    color: #2c3e50;
    font-size: 1.1rem;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .tool-content {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .description {
    margin: 0;
    color: #6c757d;
    font-size: 0.9rem;
    line-height: 1.5;
  }
  
  .firmware-selector {
    display: flex;
    gap: 0.5rem;
  }
  
  .file-input {
    flex: 1;
    padding: 0.625rem 0.875rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    background-color: #f8f9fa;
    font-size: 0.9rem;
    color: #495057;
  }
  
  .info-display {
    padding: 1rem;
    background-color: #e7f3ff;
    border-radius: 8px;
    border: 1px solid #b8daff;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .info-label {
    color: #004085;
    font-weight: 500;
  }
  
  .info-value {
    color: #004085;
    font-weight: 600;
    font-size: 1.1rem;
  }
  
  .output-display {
    max-height: 200px;
    overflow-y: auto;
    padding: 1rem;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    font-size: 0.85rem;
    margin: 0;
    color: #495057;
    line-height: 1.5;
  }
  
  .time-input {
    padding: 0.625rem 0.875rem;
    border: 1px solid #dee2e6;
    border-radius: 6px;
    font-size: 1rem;
    width: 100%;
    transition: border-color 0.2s ease;
  }
  
  .time-input:focus {
    outline: none;
    border-color: var(--primary-color, #3498db);
    box-shadow: 0 0 0 3px rgba(52, 152, 219, 0.1);
  }
  
  button {
    padding: 0.625rem 1.25rem;
    border: none;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    background-color: #f0f0f0;
    color: #333;
  }
  
  button:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  button:active:not(:disabled) {
    transform: translateY(0);
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  button.primary {
    background-color: var(--primary-color, #3498db);
    color: white;
  }
  
  button.primary:hover:not(:disabled) {
    background-color: var(--primary-hover, #2980b9);
  }
  
  button.secondary {
    background-color: #6c757d;
    color: white;
  }
  
  button.secondary:hover:not(:disabled) {
    background-color: #5a6268;
  }
  
  button.full-width {
    width: 100%;
  }
  
  /* スクロールバー */
  .output-display::-webkit-scrollbar {
    width: 6px;
  }
  
  .output-display::-webkit-scrollbar-track {
    background: #e9ecef;
    border-radius: 3px;
  }
  
  .output-display::-webkit-scrollbar-thumb {
    background: #adb5bd;
    border-radius: 3px;
  }
  
  .output-display::-webkit-scrollbar-thumb:hover {
    background: #868e96;
  }
  
  /* レスポンシブ対応 */
  @media (max-width: 768px) {
    .system-tools {
      padding: 1rem;
    }
    
    .tools-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .tool-content {
      padding: 1rem;
    }
  }
</style>
