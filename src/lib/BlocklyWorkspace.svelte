<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import * as Blockly from 'blockly';
  import 'blockly/msg/ja';
  import { defineCustomBlocks } from './blocks';
  import { initializeNqcGenerator } from './generator';
  
  const dispatch = createEventDispatcher();
  
  let blocklyDiv;
  let workspace;
  let nqcGenerator;
  
  onMount(() => {
    // カスタムブロックを定義（標準ブロックの色もオーバーライド）
    defineCustomBlocks();
    
    // NQCジェネレータを初期化
    nqcGenerator = initializeNqcGenerator();
    
    // ワークスペースを作成
    workspace = Blockly.inject(blocklyDiv, {
      toolbox: toolboxXml,
      grid: {
        spacing: 20,
        length: 3,
        colour: '#e3e3e3',
        snap: true
      },
      zoom: {
        controls: true,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2
      },
      trashcan: true,
      scrollbars: {
        horizontal: true,
        vertical: true
      },
      renderer: 'zelos',
      sounds: true
    });
    
    // 変更時にコードを更新
    let isInitializing = true;
    workspace.addChangeListener((event) => {
      // 初期化中は特別な処理
      if (isInitializing && event.type === Blockly.Events.BLOCK_CREATE) {
        isInitializing = false;
        setTimeout(() => updateCode(), 50);
      } else {
        updateCode();
      }
    });
    
    // 初期状態で空のmainタスクを追加
    addInitialMainTask();
    
    // 初期コード生成（レンダリング完了後に実行）
    requestAnimationFrame(() => {
      updateCode();
      // 念のため、もう一度実行
      setTimeout(() => {
        updateCode();
      }, 200);
    });
  });
  
  function addInitialMainTask() {
    if (!workspace) return;
    
    // 初期状態でmainタスクブロックを追加（Serialization API使用）
    const mainTaskBlock = workspace.newBlock('task_main');
    mainTaskBlock.initSvg();
    mainTaskBlock.render();
    mainTaskBlock.moveBy(50, 50);
    
    // ブロック追加後、すぐにコード更新を実行
    setTimeout(() => {
      updateCode();
    }, 0);
  }
  
  function updateCode() {
    if (!workspace || !nqcGenerator) return;
    
    try {
      const code = nqcGenerator.workspaceToCode(workspace);
      dispatch('codeUpdate', { code });
    } catch (error) {
      console.error('Code generation error:', error);
    }
  }
  
  export function clearWorkspace() {
    if (workspace) {
      workspace.clear();
      // クリア後、再度空のmainタスクを追加
      addInitialMainTask();
      updateCode();
    }
  }
  
  export function getWorkspaceXml() {
    if (!workspace) return '';
    try {
      // Serialization APIを使用
      const state = Blockly.serialization.workspaces.save(workspace);
      return JSON.stringify(state);
    } catch (e) {
      console.error('Error saving workspace:', e);
      return '';
    }
  }
  
  export function loadWorkspaceXml(xmlText) {
    if (!workspace) return;
    try {
      workspace.clear();
      // JSONかXMLかを判定
      if (xmlText.trim().startsWith('{')) {
        // JSON形式（新しいserialization format）
        const state = JSON.parse(xmlText);
        Blockly.serialization.workspaces.load(state, workspace);
      } else {
        // 古いXML形式の場合は、互換性のため対応を試みる
        console.warn('XML形式は非推奨です。JSON形式の使用を推奨します。');
        // XMLをパースして手動でブロックを作成するか、
        // プロジェクトをJSON形式で再保存することをお勧めします
      }
      updateCode();
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  }
  
  export function loadSample(sampleNumber) {
    if (!workspace) return;
    
    workspace.clear();
    
    switch(sampleNumber) {
      case 1:
        // サンプル1: タッチセンサー
        loadSample1();
        break;
        
      case 2:
        // サンプル2: ライントレース
        loadSample2();
        break;
        
      case 3:
        // サンプル3: 音楽演奏（マルチタスク）
        loadSample3();
        break;
        
      case 4:
        // サンプル4: データログ
        loadSample4();
        break;
    }
    
    updateCode();
  }
  
  function loadSample1() {
    // タッチセンサーサンプル
    const mainTask = workspace.newBlock('task_main');
    mainTask.initSvg();
    mainTask.moveBy(50, 50);
    
    const setSensor = workspace.newBlock('set_sensor');
    setSensor.setFieldValue('1', 'PORT');
    setSensor.setFieldValue('SENSOR_TOUCH', 'TYPE');
    setSensor.initSvg();
    
    const whileLoop = workspace.newBlock('while_loop');
    whileLoop.initSvg();
    
    const trueBlock = workspace.newBlock('logic_boolean');
    trueBlock.setFieldValue('TRUE', 'BOOL');
    trueBlock.initSvg();
    
    const ifElse = workspace.newBlock('if_else');
    ifElse.initSvg();
    
    const sensorValue = workspace.newBlock('sensor_value_bool');
    sensorValue.setFieldValue('1', 'PORT');
    sensorValue.initSvg();
    
    const motorOnFwd = workspace.newBlock('motor_on_fwd');
    motorOnFwd.setFieldValue('OUT_A+OUT_C', 'MOTORS');
    motorOnFwd.initSvg();
    
    const playSound = workspace.newBlock('play_sound');
    playSound.setFieldValue('SOUND_CLICK', 'SOUND');
    playSound.initSvg();
    
    const motorOff = workspace.newBlock('motor_off');
    motorOff.setFieldValue('OUT_A+OUT_C', 'MOTORS');
    motorOff.initSvg();
    
    // 接続
    mainTask.getInput('STATEMENTS').connection.connect(setSensor.previousConnection);
    setSensor.nextConnection.connect(whileLoop.previousConnection);
    whileLoop.getInput('CONDITION').connection.connect(trueBlock.outputConnection);
    whileLoop.getInput('DO').connection.connect(ifElse.previousConnection);
    ifElse.getInput('CONDITION').connection.connect(sensorValue.outputConnection);
    ifElse.getInput('DO').connection.connect(motorOnFwd.previousConnection);
    motorOnFwd.nextConnection.connect(playSound.previousConnection);
    ifElse.getInput('ELSE').connection.connect(motorOff.previousConnection);
    
    mainTask.render();
  }
  
  function loadSample2() {
    // ライントレースサンプル
    const varDecl = workspace.newBlock('variables_declare_global');
    varDecl.setFieldValue('threshold', 'VAR');
    varDecl.initSvg();
    varDecl.moveBy(50, 20);
    
    const varValue = workspace.newBlock('math_number');
    varValue.setFieldValue('40', 'NUM');
    varValue.initSvg();
    varDecl.getInput('VALUE').connection.connect(varValue.outputConnection);
    
    const mainTask = workspace.newBlock('task_main');
    mainTask.initSvg();
    mainTask.moveBy(50, 80);
    
    const setSensor = workspace.newBlock('set_sensor');
    setSensor.setFieldValue('2', 'PORT');
    setSensor.setFieldValue('SENSOR_LIGHT', 'TYPE');
    setSensor.initSvg();
    
    const setPower = workspace.newBlock('set_power');
    setPower.setFieldValue('OUT_A+OUT_C', 'MOTORS');
    setPower.setFieldValue('OUT_HALF', 'POWER');
    setPower.initSvg();
    
    const whileLoop = workspace.newBlock('while_loop');
    whileLoop.initSvg();
    
    const trueBlock = workspace.newBlock('logic_boolean');
    trueBlock.setFieldValue('TRUE', 'BOOL');
    trueBlock.initSvg();
    
    const ifElse = workspace.newBlock('if_else');
    ifElse.initSvg();
    
    const compare = workspace.newBlock('logic_compare');
    compare.setFieldValue('LT', 'OP');
    compare.initSvg();
    
    const sensorValue = workspace.newBlock('sensor_value');
    sensorValue.setFieldValue('2', 'PORT');
    sensorValue.initSvg();
    
    const varGet = workspace.newBlock('variables_get');
    varGet.setFieldValue('threshold', 'VAR');
    varGet.initSvg();
    
    const motorOnA = workspace.newBlock('motor_on_fwd');
    motorOnA.setFieldValue('OUT_A', 'MOTORS');
    motorOnA.initSvg();
    
    const motorOffC = workspace.newBlock('motor_off');
    motorOffC.setFieldValue('OUT_C', 'MOTORS');
    motorOffC.initSvg();
    
    const motorOffA = workspace.newBlock('motor_off');
    motorOffA.setFieldValue('OUT_A', 'MOTORS');
    motorOffA.initSvg();
    
    const motorOnC = workspace.newBlock('motor_on_fwd');
    motorOnC.setFieldValue('OUT_C', 'MOTORS');
    motorOnC.initSvg();
    
    // 接続
    mainTask.getInput('STATEMENTS').connection.connect(setSensor.previousConnection);
    setSensor.nextConnection.connect(setPower.previousConnection);
    setPower.nextConnection.connect(whileLoop.previousConnection);
    whileLoop.getInput('CONDITION').connection.connect(trueBlock.outputConnection);
    whileLoop.getInput('DO').connection.connect(ifElse.previousConnection);
    ifElse.getInput('CONDITION').connection.connect(compare.outputConnection);
    compare.getInput('A').connection.connect(sensorValue.outputConnection);
    compare.getInput('B').connection.connect(varGet.outputConnection);
    ifElse.getInput('DO').connection.connect(motorOnA.previousConnection);
    motorOnA.nextConnection.connect(motorOffC.previousConnection);
    ifElse.getInput('ELSE').connection.connect(motorOffA.previousConnection);
    motorOffA.nextConnection.connect(motorOnC.previousConnection);
    
    varDecl.render();
    mainTask.render();
  }
  
  function loadSample3() {
    // 音楽演奏サンプル（簡略版）
    const mainTask = workspace.newBlock('task_main');
    mainTask.initSvg();
    mainTask.moveBy(50, 50);
    
    const playNote1 = workspace.newBlock('play_note');
    playNote1.setFieldValue('262', 'NOTE');
    playNote1.setFieldValue('50', 'DURATION');
    playNote1.initSvg();
    
    const wait1 = workspace.newBlock('wait');
    wait1.initSvg();
    const waitTime1 = workspace.newBlock('math_number');
    waitTime1.setFieldValue('50', 'NUM');
    waitTime1.initSvg();
    wait1.getInput('DURATION').connection.connect(waitTime1.outputConnection);
    
    const playNote2 = workspace.newBlock('play_note');
    playNote2.setFieldValue('392', 'NOTE');
    playNote2.setFieldValue('50', 'DURATION');
    playNote2.initSvg();
    
    const wait2 = workspace.newBlock('wait');
    wait2.initSvg();
    const waitTime2 = workspace.newBlock('math_number');
    waitTime2.setFieldValue('50', 'NUM');
    waitTime2.initSvg();
    wait2.getInput('DURATION').connection.connect(waitTime2.outputConnection);
    
    // 接続
    mainTask.getInput('STATEMENTS').connection.connect(playNote1.previousConnection);
    playNote1.nextConnection.connect(wait1.previousConnection);
    wait1.nextConnection.connect(playNote2.previousConnection);
    playNote2.nextConnection.connect(wait2.previousConnection);
    
    mainTask.render();
  }
  
  function loadSample4() {
    // データログサンプル（簡略版）
    const mainTask = workspace.newBlock('task_main');
    mainTask.initSvg();
    mainTask.moveBy(50, 50);
    
    const setSensor = workspace.newBlock('set_sensor');
    setSensor.setFieldValue('1', 'PORT');
    setSensor.setFieldValue('SENSOR_LIGHT', 'TYPE');
    setSensor.initSvg();
    
    const createLog = workspace.newBlock('create_datalog');
    createLog.initSvg();
    const logSize = workspace.newBlock('math_number');
    logSize.setFieldValue('100', 'NUM');
    logSize.initSvg();
    createLog.getInput('SIZE').connection.connect(logSize.outputConnection);
    
    const addLog = workspace.newBlock('add_to_datalog');
    addLog.initSvg();
    const sensorVal = workspace.newBlock('sensor_value');
    sensorVal.setFieldValue('1', 'PORT');
    sensorVal.initSvg();
    addLog.getInput('VALUE').connection.connect(sensorVal.outputConnection);
    
    const playSound = workspace.newBlock('play_sound');
    playSound.setFieldValue('SOUND_DOUBLE_BEEP', 'SOUND');
    playSound.initSvg();
    
    // 接続
    mainTask.getInput('STATEMENTS').connection.connect(setSensor.previousConnection);
    setSensor.nextConnection.connect(createLog.previousConnection);
    createLog.nextConnection.connect(addLog.previousConnection);
    addLog.nextConnection.connect(playSound.previousConnection);
    
    mainTask.render();
  }
  
  const toolboxXml = `
    <xml xmlns="https://developers.google.com/blockly/xml" id="toolbox" style="display: none">
      <category name="動き" colour="#4C97FF">
        <block type="motor_on">
          <field name="MOTORS">OUT_A</field>
        </block>
        <block type="motor_off">
          <field name="MOTORS">OUT_A</field>
        </block>
        <block type="motor_fwd">
          <field name="MOTORS">OUT_A</field>
        </block>
        <block type="motor_rev">
          <field name="MOTORS">OUT_A</field>
        </block>
        <block type="motor_on_fwd">
          <field name="MOTORS">OUT_A</field>
        </block>
        <block type="motor_on_for">
          <field name="MOTORS">OUT_A</field>
          <value name="TIME">
            <block type="math_number">
              <field name="NUM">100</field>
            </block>
          </value>
        </block>
        <block type="set_power">
          <field name="MOTORS">OUT_A</field>
          <field name="POWER">OUT_FULL</field>
        </block>
      </category>
      
      <category name="音" colour="#FF6EC7">
        <block type="play_sound">
          <field name="SOUND">SOUND_CLICK</field>
        </block>
        <block type="play_tone">
          <value name="FREQ">
            <block type="math_number">
              <field name="NUM">440</field>
            </block>
          </value>
          <value name="DURATION">
            <block type="math_number">
              <field name="NUM">50</field>
            </block>
          </value>
        </block>
        <block type="play_note">
          <field name="NOTE">262</field>
          <field name="DURATION">50</field>
        </block>
      </category>

      <category name="見た目" colour="#9966FF">
        <block type="select_display">
          <field name="MODE">DISPLAY_WATCH</field>
        </block>
        <block type="set_user_display">
          <value name="VALUE">
            <block type="variables_get">
              <field name="VAR">x</field>
            </block>
          </value>
          <value name="PRECISION">
            <block type="math_number">
              <field name="NUM">0</field>
            </block>
          </value>
        </block>
      </category>

      <category name="イベント" colour="#FFBF00">
        <block type="task_main"></block>
        <block type="task_custom">
          <field name="TASKNAME">myTask</field>
        </block>
        <block type="start_task">
          <field name="TASKNAME">myTask</field>
        </block>
        <block type="stop_task">
          <field name="TASKNAME">myTask</field>
        </block>
      </category>
      
      <category name="制御" colour="#FFAB19">
        <block type="if_else"></block>
        <block type="controls_if"></block>
        <block type="controls_ifelse"></block>
        <block type="while_loop"></block>
        <block type="controls_whileUntil"></block>
        <block type="controls_for">
          <value name="FROM">
            <block type="math_number">
              <field name="NUM">1</field>
            </block>
          </value>
          <value name="TO">
            <block type="math_number">
              <field name="NUM">10</field>
            </block>
          </value>
          <value name="BY">
            <block type="math_number">
              <field name="NUM">1</field>
            </block>
          </value>
        </block>
        <block type="repeat_times">
          <value name="TIMES">
            <block type="math_number">
              <field name="NUM">10</field>
            </block>
          </value>
        </block>
        <block type="wait">
          <value name="DURATION">
            <block type="math_number">
              <field name="NUM">100</field>
            </block>
          </value>
        </block>
      </category>
      
      <category name="調べる" colour="#4CBFE6">
        <block type="set_sensor">
          <field name="PORT">1</field>
          <field name="TYPE">SENSOR_TOUCH</field>
        </block>
        <block type="sensor_value">
          <field name="PORT">1</field>
        </block>
        <block type="sensor_value_bool">
          <field name="PORT">1</field>
        </block>
        <block type="clear_sensor">
          <field name="PORT">1</field>
        </block>
        <block type="timer_value">
          <field name="TIMER">0</field>
        </block>
        <block type="clear_timer">
          <field name="TIMER">0</field>
        </block>
      </category>
      
      <category name="演算" colour="#40BF4A">
        <block type="math_number">
          <field name="NUM">0</field>
        </block>
        <block type="math_arithmetic">
          <field name="OP">ADD</field>
        </block>
        <block type="logic_compare">
          <field name="OP">EQ</field>
        </block>
        <block type="logic_operation">
          <field name="OP">AND</field>
        </block>
        <block type="logic_negate"></block>
        <block type="logic_boolean">
          <field name="BOOL">TRUE</field>
        </block>
      </category>
      
      <category name="変数" colour="#FF8C1A">
        <block type="variables_declare_global">
          <field name="VAR">x</field>
          <value name="VALUE">
            <block type="math_number">
              <field name="NUM">0</field>
            </block>
          </value>
        </block>
        <block type="variables_get">
          <field name="VAR">x</field>
        </block>
        <block type="variables_set">
          <field name="VAR">x</field>
          <value name="VALUE">
            <block type="math_number">
              <field name="NUM">0</field>
            </block>
          </value>
        </block>
        <block type="variables_change">
          <field name="VAR">x</field>
          <value name="DELTA">
            <block type="math_number">
              <field name="NUM">1</field>
            </block>
          </value>
        </block>
      </category>
      
      <category name="データログ" colour="#FF6680">
        <block type="create_datalog">
          <value name="SIZE">
            <block type="math_number">
              <field name="NUM">100</field>
            </block>
          </value>
        </block>
        <block type="add_to_datalog">
          <value name="VALUE">
            <block type="sensor_value">
              <field name="PORT">1</field>
            </block>
          </value>
        </block>
      </category>
    </xml>
  `;
</script>

<div bind:this={blocklyDiv} class="blockly-workspace"></div>

<style>
  .blockly-workspace {
    flex: 1;
    height: 100%;
    background-color: white;
  }
</style>
