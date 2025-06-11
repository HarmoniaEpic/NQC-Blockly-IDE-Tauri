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
      <h3>🔧 ファームウェア管理</h3>
      <div class="tool-content">
        <p>RCXファームウェアをダウンロードします。</p>
        <div class="firmware-selector">
          <input type="text" readonly value={firmwarePath} placeholder="ファームウェアファイル (.lgo)" />
          <button on:click={selectFirmware}>選択</button>
        </div>
        <button on:click={downloadFirmware} disabled={!firmwarePath || isLoading} class="primary">
          ファームウェアをダウンロード
        </button>
      </div>
    </div>
    
    <!-- バッテリー情報 -->
    <div class="tool-card">
      <h3>🔋 バッテリー情報</h3>
      <div class="tool-content">
        <p>RCXのバッテリー電圧を確認します。</p>
        {#if batteryLevel}
          <div class="info-display">
            バッテリー電圧: <strong>{batteryLevel}</strong>
          </div>
        {/if}
        <button on:click={getBatteryLevel} disabled={isLoading}>
          バッテリーレベルを取得
        </button>
      </div>
    </div>
    
    <!-- 時刻設定 -->
    <div class="tool-card">
      <h3>🕐 時刻設定</h3>
      <div class="tool-content">
        <p>RCXの内部時計を設定します。</p>
        <input type="time" bind:value={currentTime} />
        <button on:click={setRCXTime} disabled={isLoading}>
          時刻を設定
        </button>
      </div>
    </div>
    
    <!-- プログラムスロット -->
    <div class="tool-card">
      <h3>📦 プログラムスロット</h3>
      <div class="tool-content">
        <p>プログラムスロットの使用状況を確認します。</p>
        {#if programSlots}
          <pre class="output-display">{programSlots}</pre>
        {/if}
        <button on:click={getProgramSlots} disabled={isLoading}>
          スロット情報を取得
        </button>
      </div>
    </div>
    
    <!-- データログ -->
    <div class="tool-card">
      <h3>📊 データログ</h3>
      <div class="tool-content">
        <p>RCXからデータログをアップロードします。</p>
        {#if datalog}
          <pre class="output-display">{datalog}</pre>
        {/if}
        <button on:click={uploadDatalog} disabled={isLoading}>
          データログをアップロード
        </button>
      </div>
    </div>
    
    <!-- メモリマップ -->
    <div class="tool-card">
      <h3>🗺️ メモリマップ</h3>
      <div class="tool-content">
        <p>RCXのメモリ使用状況を確認します。</p>
        {#if memoryMap}
          <pre class="output-display">{memoryMap}</pre>
        {/if}
        <button on:click={getMemoryMap} disabled={isLoading}>
          メモリマップを取得
        </button>
      </div>
    </div>
  </div>
</div>

<style>
  .system-tools {
    position: relative;
    padding: 1rem;
    height: 100%;
    overflow-y: auto;
    background-color: #f5f5f5;
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
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 1rem;
  }
  
  .tool-card {
    background-color: white;
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .tool-card h3 {
    margin: 0 0 1rem 0;
    color: #2c3e50;
    font-size: 1.1rem;
  }
  
  .tool-content {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .tool-content p {
    margin: 0;
    color: #666;
    font-size: 0.9rem;
  }
  
  .firmware-selector {
    display: flex;
    gap: 0.5rem;
  }
  
  .firmware-selector input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    background-color: #f8f8f8;
  }
  
  .info-display {
    padding: 0.75rem;
    background-color: #e8f4f8;
    border-radius: 4px;
    color: #2c3e50;
  }
  
  .output-display {
    max-height: 200px;
    overflow-y: auto;
    padding: 0.75rem;
    background-color: #f8f8f8;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.85rem;
    margin: 0;
  }
  
  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: #3498db;
    color: white;
    cursor: pointer;
    font-size: 0.9rem;
    transition: background-color 0.2s;
  }
  
  button:hover:not(:disabled) {
    background-color: #2980b9;
  }
  
  button:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
  
  button.primary {
    background-color: #27ae60;
  }
  
  button.primary:hover:not(:disabled) {
    background-color: #219a52;
  }
  
  input[type="time"] {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
</style>