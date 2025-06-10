<script>
  import { onMount, createEventDispatcher } from 'svelte';
  import * as Blockly from 'blockly';
  import * as BlocklyXml from 'blockly/xml';
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
    try {
      // BlocklyXmlを使用
      const xml = BlocklyXml.workspaceToDom(workspace);
      return BlocklyXml.domToText(xml);
    } catch (e) {
      console.error('Error saving workspace:', e);
      // フォールバック: serialization APIを使用
      const state = Blockly.serialization.workspaces.save(workspace);
      return JSON.stringify(state);
    }
  }
  
  export function loadWorkspaceXml(xmlText) {
    if (!workspace) return;
    try {
      workspace.clear();
      // BlocklyXmlを使用
      const xml = BlocklyXml.textToDom(xmlText);
      BlocklyXml.domToWorkspace(xml, workspace);
      updateCode();
    } catch (error) {
      console.error('Failed to load workspace:', error);
    }
  }
  
  export function loadSample(sampleNumber) {
    if (!workspace) return;
    
    let xmlText = '';
    
    switch(sampleNumber) {
      case 1:
        // サンプル1: タッチセンサー
        xmlText = `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="task_main" x="50" y="50">
              <statement name="STATEMENTS">
                <block type="set_sensor">
                  <field name="PORT">1</field>
                  <field name="TYPE">SENSOR_TOUCH</field>
                  <next>
                    <block type="while_loop">
                      <value name="CONDITION">
                        <block type="logic_boolean">
                          <field name="BOOL">TRUE</field>
                        </block>
                      </value>
                      <statement name="DO">
                        <block type="if_else">
                          <value name="CONDITION">
                            <block type="sensor_value_bool">
                              <field name="PORT">1</field>
                            </block>
                          </value>
                          <statement name="DO">
                            <block type="motor_on_fwd">
                              <field name="MOTORS">OUT_A+OUT_C</field>
                              <next>
                                <block type="play_sound">
                                  <field name="SOUND">SOUND_CLICK</field>
                                </block>
                              </next>
                            </block>
                          </statement>
                          <statement name="ELSE">
                            <block type="motor_off">
                              <field name="MOTORS">OUT_A+OUT_C</field>
                            </block>
                          </statement>
                        </block>
                      </statement>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </xml>
        `;
        break;
        
      case 2:
        // サンプル2: ライントレース
        xmlText = `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="variables_declare_global" x="50" y="20">
              <field name="VAR">threshold</field>
              <value name="VALUE">
                <block type="math_number">
                  <field name="NUM">40</field>
                </block>
              </value>
            </block>
            <block type="task_main" x="50" y="80">
              <statement name="STATEMENTS">
                <block type="set_sensor">
                  <field name="PORT">2</field>
                  <field name="TYPE">SENSOR_LIGHT</field>
                  <next>
                    <block type="set_power">
                      <field name="MOTORS">OUT_A+OUT_C</field>
                      <field name="POWER">OUT_HALF</field>
                      <next>
                        <block type="while_loop">
                          <value name="CONDITION">
                            <block type="logic_boolean">
                              <field name="BOOL">TRUE</field>
                            </block>
                          </value>
                          <statement name="DO">
                            <block type="if_else">
                              <value name="CONDITION">
                                <block type="logic_compare">
                                  <field name="OP">LT</field>
                                  <value name="A">
                                    <block type="sensor_value">
                                      <field name="PORT">2</field>
                                    </block>
                                  </value>
                                  <value name="B">
                                    <block type="variables_get">
                                      <field name="VAR">threshold</field>
                                    </block>
                                  </value>
                                </block>
                              </value>
                              <statement name="DO">
                                <block type="motor_on_fwd">
                                  <field name="MOTORS">OUT_A</field>
                                  <next>
                                    <block type="motor_off">
                                      <field name="MOTORS">OUT_C</field>
                                    </block>
                                  </next>
                                </block>
                              </statement>
                              <statement name="ELSE">
                                <block type="motor_off">
                                  <field name="MOTORS">OUT_A</field>
                                  <next>
                                    <block type="motor_on_fwd">
                                      <field name="MOTORS">OUT_C</field>
                                    </block>
                                  </next>
                                </block>
                              </statement>
                            </block>
                          </statement>
                        </block>
                      </next>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </xml>
        `;
        break;
        
      case 3:
        // サンプル3: 音楽演奏（マルチタスク）
        xmlText = `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="task_main" x="50" y="50">
              <statement name="STATEMENTS">
                <block type="start_task">
                  <field name="TASKNAME">melody1</field>
                  <next>
                    <block type="wait">
                      <value name="DURATION">
                        <block type="math_number">
                          <field name="NUM">200</field>
                        </block>
                      </value>
                      <next>
                        <block type="start_task">
                          <field name="TASKNAME">melody2</field>
                          <next>
                            <block type="wait">
                              <value name="DURATION">
                                <block type="math_number">
                                  <field name="NUM">200</field>
                                </block>
                              </value>
                              <next>
                                <block type="stop_task">
                                  <field name="TASKNAME">melody1</field>
                                </block>
                              </next>
                            </block>
                          </next>
                        </block>
                      </next>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
            
            <block type="task_custom" x="400" y="50">
              <field name="TASKNAME">melody1</field>
              <statement name="STATEMENTS">
                <block type="repeat_times">
                  <value name="TIMES">
                    <block type="math_number">
                      <field name="NUM">10</field>
                    </block>
                  </value>
                  <statement name="DO">
                    <block type="play_note">
                      <field name="NOTE">262</field>
                      <field name="DURATION">25</field>
                      <next>
                        <block type="wait">
                          <value name="DURATION">
                            <block type="math_number">
                              <field name="NUM">25</field>
                            </block>
                          </value>
                        </block>
                      </next>
                    </block>
                  </statement>
                </block>
              </statement>
            </block>
            
            <block type="task_custom" x="400" y="250">
              <field name="TASKNAME">melody2</field>
              <statement name="STATEMENTS">
                <block type="repeat_times">
                  <value name="TIMES">
                    <block type="math_number">
                      <field name="NUM">5</field>
                    </block>
                  </value>
                  <statement name="DO">
                    <block type="play_note">
                      <field name="NOTE">392</field>
                      <field name="DURATION">50</field>
                      <next>
                        <block type="wait">
                          <value name="DURATION">
                            <block type="math_number">
                              <field name="NUM">50</field>
                            </block>
                          </value>
                        </block>
                      </next>
                    </block>
                  </statement>
                </block>
              </statement>
            </block>
          </xml>
        `;
        break;
        
      case 4:
        // サンプル4: データログ
        xmlText = `
          <xml xmlns="https://developers.google.com/blockly/xml">
            <block type="variables_declare_global" x="50" y="20">
              <field name="VAR">count</field>
              <value name="VALUE">
                <block type="math_number">
                  <field name="NUM">0</field>
                </block>
              </value>
            </block>
            <block type="task_main" x="50" y="80">
              <statement name="STATEMENTS">
                <block type="set_sensor">
                  <field name="PORT">1</field>
                  <field name="TYPE">SENSOR_LIGHT</field>
                  <next>
                    <block type="create_datalog">
                      <value name="SIZE">
                        <block type="math_number">
                          <field name="NUM">100</field>
                        </block>
                      </value>
                      <next>
                        <block type="clear_timer">
                          <field name="TIMER">0</field>
                          <next>
                            <block type="repeat_times">
                              <value name="TIMES">
                                <block type="math_number">
                                  <field name="NUM">100</field>
                                </block>
                              </value>
                              <statement name="DO">
                                <block type="add_to_datalog">
                                  <value name="VALUE">
                                    <block type="sensor_value">
                                      <field name="PORT">1</field>
                                    </block>
                                  </value>
                                  <next>
                                    <block type="add_to_datalog">
                                      <value name="VALUE">
                                        <block type="timer_value">
                                          <field name="TIMER">0</field>
                                        </block>
                                      </value>
                                      <next>
                                        <block type="variables_change">
                                          <field name="VAR">count</field>
                                          <value name="DELTA">
                                            <block type="math_number">
                                              <field name="NUM">1</field>
                                            </block>
                                          </value>
                                          <next>
                                            <block type="wait">
                                              <value name="DURATION">
                                                <block type="math_number">
                                                  <field name="NUM">50</field>
                                                </block>
                                              </value>
                                            </block>
                                          </next>
                                        </block>
                                      </next>
                                    </block>
                                  </next>
                                </block>
                              </statement>
                              <next>
                                <block type="play_sound">
                                  <field name="SOUND">SOUND_DOUBLE_BEEP</field>
                                </block>
                              </next>
                            </block>
                          </next>
                        </block>
                      </next>
                    </block>
                  </next>
                </block>
              </statement>
            </block>
          </xml>
        `;
        break;
    }
    
    if (xmlText) {
      loadWorkspaceXml(xmlText);
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
