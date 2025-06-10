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
      sounds: false
    });
    
    // 変更時にコードを更新
    workspace.addChangeListener(() => {
      updateCode();
    });
    
    // 初期コード生成
    updateCode();
  });
  
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
      updateCode();
    }
  }
  
  export function getWorkspaceXml() {
    if (!workspace) return '';
    const xml = Blockly.Xml.workspaceToDom(workspace);
    return Blockly.Xml.domToText(xml);
  }
  
  export function loadWorkspaceXml(xmlText) {
    if (!workspace) return;
    try {
      workspace.clear();
      const xml = Blockly.Xml.textToDom(xmlText);
      Blockly.Xml.domToWorkspace(xml, workspace);
      updateCode();
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
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
        <block type="controls_if"></block>
        <block type="controls_ifelse"></block>
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
