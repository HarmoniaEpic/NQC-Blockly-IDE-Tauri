import * as Blockly from 'blockly';

export function defineCustomBlocks() {
  // 標準ブロックの色をオーバーライド
  overrideStandardBlockColors();
  
  // タスクブロック
  Blockly.Blocks['task_main'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("タスク main");
      this.appendStatementInput("STATEMENTS")
        .setCheck(null);
      this.setColour('#FFBF00');
      this.setTooltip("メインタスクを定義します");
    }
  };
  
  Blockly.Blocks['task_custom'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("タスク")
        .appendField(new Blockly.FieldTextInput("myTask"), "TASKNAME");
      this.appendStatementInput("STATEMENTS")
        .setCheck(null);
      this.setColour('#FFBF00');
      this.setTooltip("カスタムタスクを定義します");
    }
  };
  
  Blockly.Blocks['start_task'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("タスクを開始")
        .appendField(new Blockly.FieldTextInput("myTask"), "TASKNAME");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };
  
  Blockly.Blocks['stop_task'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("タスクを停止")
        .appendField(new Blockly.FieldTextInput("myTask"), "TASKNAME");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFBF00');
    }
  };
  
  // モーターブロック
  Blockly.Blocks['motor_on'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("モーター")
        .appendField(new Blockly.FieldDropdown([
          ["A", "OUT_A"],
          ["B", "OUT_B"],
          ["C", "OUT_C"],
          ["A+B", "OUT_A+OUT_B"],
          ["A+C", "OUT_A+OUT_C"],
          ["B+C", "OUT_B+OUT_C"],
          ["全て", "OUT_A+OUT_B+OUT_C"]
        ]), "MOTORS")
        .appendField("をON");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };
  
  Blockly.Blocks['motor_off'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("モーター")
        .appendField(new Blockly.FieldDropdown([
          ["A", "OUT_A"],
          ["B", "OUT_B"],
          ["C", "OUT_C"],
          ["A+B", "OUT_A+OUT_B"],
          ["A+C", "OUT_A+OUT_C"],
          ["B+C", "OUT_B+OUT_C"],
          ["全て", "OUT_A+OUT_B+OUT_C"]
        ]), "MOTORS")
        .appendField("をOFF");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };
  
  Blockly.Blocks['motor_fwd'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("モーター")
        .appendField(new Blockly.FieldDropdown([
          ["A", "OUT_A"],
          ["B", "OUT_B"],
          ["C", "OUT_C"],
          ["A+B", "OUT_A+OUT_B"],
          ["A+C", "OUT_A+OUT_C"],
          ["B+C", "OUT_B+OUT_C"],
          ["全て", "OUT_A+OUT_B+OUT_C"]
        ]), "MOTORS")
        .appendField("を前進方向に設定");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };
  
  Blockly.Blocks['motor_rev'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("モーター")
        .appendField(new Blockly.FieldDropdown([
          ["A", "OUT_A"],
          ["B", "OUT_B"],
          ["C", "OUT_C"],
          ["A+B", "OUT_A+OUT_B"],
          ["A+C", "OUT_A+OUT_C"],
          ["B+C", "OUT_B+OUT_C"],
          ["全て", "OUT_A+OUT_B+OUT_C"]
        ]), "MOTORS")
        .appendField("を後退方向に設定");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };
  
  Blockly.Blocks['motor_on_fwd'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("モーター")
        .appendField(new Blockly.FieldDropdown([
          ["A", "OUT_A"],
          ["B", "OUT_B"],
          ["C", "OUT_C"],
          ["A+B", "OUT_A+OUT_B"],
          ["A+C", "OUT_A+OUT_C"],
          ["B+C", "OUT_B+OUT_C"],
          ["全て", "OUT_A+OUT_B+OUT_C"]
        ]), "MOTORS")
        .appendField("を前進でON");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };
  
  Blockly.Blocks['motor_on_for'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("モーター")
        .appendField(new Blockly.FieldDropdown([
          ["A", "OUT_A"],
          ["B", "OUT_B"],
          ["C", "OUT_C"],
          ["A+B", "OUT_A+OUT_B"],
          ["A+C", "OUT_A+OUT_C"],
          ["B+C", "OUT_B+OUT_C"],
          ["全て", "OUT_A+OUT_B+OUT_C"]
        ]), "MOTORS")
        .appendField("を");
      this.appendValueInput("TIME")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField("× 0.01秒間ON");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };
  
  Blockly.Blocks['set_power'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("モーター")
        .appendField(new Blockly.FieldDropdown([
          ["A", "OUT_A"],
          ["B", "OUT_B"],
          ["C", "OUT_C"],
          ["A+B", "OUT_A+OUT_B"],
          ["A+C", "OUT_A+OUT_C"],
          ["B+C", "OUT_B+OUT_C"],
          ["全て", "OUT_A+OUT_B+OUT_C"]
        ]), "MOTORS")
        .appendField("のパワーを")
        .appendField(new Blockly.FieldDropdown([
          ["低 (1)", "OUT_LOW"],
          ["中 (4)", "OUT_HALF"],
          ["高 (7)", "OUT_FULL"]
        ]), "POWER");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4C97FF');
    }
  };
  
  // センサーブロック
  Blockly.Blocks['set_sensor'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("センサー")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "PORT")
        .appendField("を")
        .appendField(new Blockly.FieldDropdown([
          ["タッチセンサー", "SENSOR_TOUCH"],
          ["光センサー", "SENSOR_LIGHT"],
          ["回転センサー", "SENSOR_ROTATION"],
          ["温度センサー（℃）", "SENSOR_CELSIUS"],
          ["温度センサー（°F）", "SENSOR_FAHRENHEIT"]
        ]), "TYPE")
        .appendField("に設定");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4CBFE6');
    }
  };
  
  Blockly.Blocks['sensor_value'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("センサー")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "PORT")
        .appendField("の値");
      this.setOutput(true, "Number");
      this.setColour('#4CBFE6');
    }
  };
  
  Blockly.Blocks['sensor_value_bool'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("センサー")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "PORT")
        .appendField("のブール値");
      this.setOutput(true, "Boolean");
      this.setColour('#4CBFE6');
    }
  };
  
  Blockly.Blocks['clear_sensor'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("センサー")
        .appendField(new Blockly.FieldDropdown([
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "PORT")
        .appendField("をクリア");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4CBFE6');
    }
  };
  
  // タイマーブロック
  Blockly.Blocks['timer_value'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("タイマー")
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"],
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "TIMER")
        .appendField("の値");
      this.setOutput(true, "Number");
      this.setColour('#4CBFE6');
    }
  };
  
  Blockly.Blocks['clear_timer'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("タイマー")
        .appendField(new Blockly.FieldDropdown([
          ["0", "0"],
          ["1", "1"],
          ["2", "2"],
          ["3", "3"]
        ]), "TIMER")
        .appendField("をクリア");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#4CBFE6');
    }
  };
  
  // 音ブロック
  Blockly.Blocks['play_sound'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("サウンドを再生")
        .appendField(new Blockly.FieldDropdown([
          ["クリック", "SOUND_CLICK"],
          ["ダブルビープ", "SOUND_DOUBLE_BEEP"],
          ["下降音", "SOUND_DOWN"],
          ["上昇音", "SOUND_UP"],
          ["低いビープ", "SOUND_LOW_BEEP"],
          ["速い上昇音", "SOUND_FAST_UP"]
        ]), "SOUND");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF6EC7');
    }
  };
  
  Blockly.Blocks['play_tone'] = {
    init: function() {
      this.appendValueInput("FREQ")
        .setCheck("Number")
        .appendField("周波数");
      this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("Hz を");
      this.appendDummyInput()
        .appendField("× 0.01秒 鳴らす");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF6EC7');
    }
  };
  
  Blockly.Blocks['play_note'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("音を鳴らす")
        .appendField(new Blockly.FieldDropdown([
          ["ド (C4)", "262"],
          ["レ (D4)", "294"],
          ["ミ (E4)", "330"],
          ["ファ (F4)", "349"],
          ["ソ (G4)", "392"],
          ["ラ (A4)", "440"],
          ["シ (B4)", "494"],
          ["ド (C5)", "523"]
        ]), "NOTE")
        .appendField("長さ")
        .appendField(new Blockly.FieldDropdown([
          ["0.25秒", "25"],
          ["0.5秒", "50"],
          ["1秒", "100"],
          ["2秒", "200"]
        ]), "DURATION");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF6EC7');
    }
  };
  
  // =========================
  // 見た目ブロック（LCD表示）
  // =========================
  
  // 表示モード選択ブロック
  Blockly.Blocks['select_display'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("LCD表示を")
        .appendField(new Blockly.FieldDropdown([
          ["時計", "DISPLAY_WATCH"],
          ["センサー1", "DISPLAY_SENSOR_1"],
          ["センサー2", "DISPLAY_SENSOR_2"],
          ["センサー3", "DISPLAY_SENSOR_3"],
          ["出力A", "DISPLAY_OUT_A"],
          ["出力B", "DISPLAY_OUT_B"],
          ["出力C", "DISPLAY_OUT_C"]
        ]), "MODE")
        .appendField("に設定");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
      this.setTooltip("LCD表示モードを選択します");
    }
  };
  
  // ユーザー表示設定ブロック（RCX2のみ）
  Blockly.Blocks['set_user_display'] = {
    init: function() {
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("LCDに");
      this.appendDummyInput()
        .appendField("を小数点");
      this.appendValueInput("PRECISION")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField("桁で表示");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#9966FF');
      this.setTooltip("LCDにユーザー定義の値を表示します（RCX2のみ）");
    }
  };
  
  // 待機ブロック
  Blockly.Blocks['wait'] = {
    init: function() {
      this.appendValueInput("DURATION")
        .setCheck("Number")
        .appendField("待つ");
      this.appendDummyInput()
        .appendField("× 0.01秒");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };
  
  // 変数ブロック
  Blockly.Blocks['variables_declare_global'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("グローバル変数")
        .appendField(new Blockly.FieldTextInput("x"), "VAR")
        .appendField("を");
      this.appendValueInput("VALUE")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField("で初期化");
      this.setInputsInline(true);
      this.setColour('#FF8C1A');
      this.setTooltip("グローバル変数を宣言して初期値を設定します");
    }
  };
  
  Blockly.Blocks['variables_get'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("x"), "VAR");
      this.setOutput(true, "Number");
      this.setColour('#FF8C1A');
    }
  };
  
  Blockly.Blocks['variables_set'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("x"), "VAR")
        .appendField("を");
      this.appendValueInput("VALUE")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField("にする");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF8C1A');
    }
  };
  
  Blockly.Blocks['variables_change'] = {
    init: function() {
      this.appendDummyInput()
        .appendField("変数")
        .appendField(new Blockly.FieldTextInput("x"), "VAR")
        .appendField("を");
      this.appendValueInput("DELTA")
        .setCheck("Number");
      this.appendDummyInput()
        .appendField("だけ増やす");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF8C1A');
    }
  };

  // if-elseブロック
  Blockly.Blocks['if_else'] = {
    init: function() {
      this.appendValueInput("CONDITION")
        .setCheck(null)
        .appendField("もし");
      this.appendDummyInput()
        .appendField("なら");
      this.appendStatementInput("DO")
        .setCheck(null);
      this.appendDummyInput()
        .appendField("でなければ");
      this.appendStatementInput("ELSE")
        .setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
      this.setTooltip("条件分岐（if-else）");
    }
  };

  // whileループブロック
  Blockly.Blocks['while_loop'] = {
    init: function() {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("繰り返す 条件:");
      this.appendStatementInput("DO")
        .setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
      this.setTooltip("条件が真の間繰り返します");
    }
  };

  // repeat繰り返しブロック
  Blockly.Blocks['repeat_times'] = {
    init: function() {
      this.appendValueInput("TIMES")
        .setCheck("Number")
        .appendField("繰り返す");
      this.appendDummyInput()
        .appendField("回");
      this.appendStatementInput("DO")
        .setCheck(null);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FFAB19');
    }
  };

  // データログブロック
  Blockly.Blocks['create_datalog'] = {
    init: function() {
      this.appendValueInput("SIZE")
        .setCheck("Number")
        .appendField("データログを");
      this.appendDummyInput()
        .appendField("件作成");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF6680');
      this.setTooltip("データログを作成します");
    }
  };
  
  Blockly.Blocks['add_to_datalog'] = {
    init: function() {
      this.appendValueInput("VALUE")
        .setCheck(null)
        .appendField("データログに");
      this.appendDummyInput()
        .appendField("を追加");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour('#FF6680');
      this.setTooltip("データログに値を追加します");
    }
  };
}

// 標準ブロックの色をオーバーライド
function overrideStandardBlockColors() {
  // 制御ブロック（オレンジ色 #FFAB19）
  const controlColor = '#FFAB19';
  const controlBlocks = ['controls_if', 'controls_ifelse', 'controls_whileUntil', 'controls_for'];
  
  controlBlocks.forEach(blockType => {
    if (Blockly.Blocks[blockType]) {
      const originalInit = Blockly.Blocks[blockType].init;
      Blockly.Blocks[blockType].init = function() {
        originalInit.call(this);
        this.setColour(controlColor);
      };
    }
  });
  
  // 演算・論理ブロック（緑色 #40BF4A）
  const mathColor = '#40BF4A';
  const mathBlocks = ['math_number', 'math_arithmetic', 'logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean'];
  
  mathBlocks.forEach(blockType => {
    if (Blockly.Blocks[blockType]) {
      const originalInit = Blockly.Blocks[blockType].init;
      Blockly.Blocks[blockType].init = function() {
        originalInit.call(this);
        this.setColour(mathColor);
      };
    }
  });
}
