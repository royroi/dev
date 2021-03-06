/*
 * Copyright (c) 2019 abetusk
 *
 * This source code is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This source code is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this source code.  If not, see <https://www.gnu.org/licenses/>.
 *
 */

//-------------

var g_ctx = {
  "ui_change_timeout" : 0,
  "current_ui" : "ui_tab_main"
};

function _switch_ui(to) {
  var ele;

  console.log(">>>to", to);

  if (g_ctx.ui_change_timeoutid > 0) {
    window.clearTimeout(g_ctx.ui_change_timeoutid);
    g_ctx.ui_change_timeoutid = -1;
  }

  var from = g_ctx.current_ui;

  ele = document.getElementById(from);
  ele.style.display = "none";

  ele = document.getElementById(to);
  ele.style.display = "block";

  g_ctx.current_ui = to;

}


function _hide_ui(from) {
  var ele = document.getElementById(from);
  ele.style.display = "none";
}

function _hide_ui_element(from) {
  var ele = document.getElementById(from);
  ele.style.display = "none";
}

function _show_ui(to) {
  var ele = document.getElementById(to);
  ele.style.display = "block";

  g_ctx.current_ui = to;
}

function _show_ui_element(to) {
  var ele = document.getElementById(to);
  ele.style.display = "block";
}




var g_innerlight = {

  "url" : "http://localhost:8080/req",

  "mode_index": 0,
  "mode":"on",
  "modes": ["solid", "solid_color", "noise",
            "tap_pulse", "tap_bullet", "tap_strobe",
            "fill", "strobe", "pulse", "rainbow",
            "mic_strobe", "mic_bullet", "mic_pulse" ],
  "mic_tap":"mic",
  "tempo_bpm":120,
  "option_value": 15,

  "tap_bpm_min" : 60.0,
  "tap_bpm_max" : 260.0,


  "tap_bpm" : 120.0,
  "tap_progression_numerator" : 0,
  "tap_progression_denominator" : 12,
  "tap_progression_cancel_ms" : 2000,
  "tap_progression_last_ms" : -1,
  "tap_progression_time" : [],
  "tap_progression_timout" : null,

  "color_fg":[0,0,0],
  "color_bg":[255,255,255],
  "color_map": [ [255,211,25] , [255,144,31] , [255,41,117] , [242,34,255] , [140,30,255] ]
};

function _send_api_req(data_obj) {
  var data_str = "";
  for (var _key in data_obj) {
    if (data_str.length > 0) { data_str += "&"; }
    data_str += _key + "=" + data_obj[_key];
  }

  console.log(">> send_api_req", data_str);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", g_innerlight.url, true);
  xhr.setRequestHeader('Content-Type', "application/x-www-form-urlencoded; charset=UTF-8" );
  xhr.send(data_str);
}

function _rgb2hex(rgb) {
  var s = "", d = "";

  d = rgb[0].toString(16);
  s += ((d.length==1) ? ("0" + d) : d);

  d = rgb[1].toString(16);
  s += ((d.length==1) ? ("0" + d) : d);

  d = rgb[2].toString(16);
  s += ((d.length==1) ? ("0" + d) : d);


  return s;
}

function _send_state() {

  var color_hex_str = "";

  color_hex_str = _rgb2hex(g_innerlight.color_map[0]);
  for (var ii=1; ii<g_innerlight.color_map.length; ii++) {
    color_hex_str += "," + _rgb2hex(g_innerlight.color_map[ii]);
  }

  var data = {
    "mode": g_innerlight.mode,
    "tap_bpm":g_innerlight.tap_bpm,
    "opt_val" : g_innerlight.option_value,
    "fg": _rgb2hex( g_innerlight.color_fg ),
    "bg": _rgb2hex( g_innerlight.color_bg ),
    "palette" : color_hex_str
  };

  _send_api_req(data);
}

function _clamp_bpm() {
  if (g_innerlight.tap_bpm < g_innerlight.tap_bpm_min) {
    g_innerlight.tap_bpm = g_innerlight.tap_bpm_min;
  }

  if (g_innerlight.tap_bpm > g_innerlight.tap_bpm_max) {
    g_innerlight.tap_bpm = g_innerlight.tap_bpm_max;
  }

  return g_innerlight.tap_bpm;
}

function _mode(val) {
  console.log(">>mode", val);

  var n = g_innerlight.modes.length;
  var idx = 0;

  idx = g_innerlight.mode_index;
  if (val>0) {
    idx += 1;
  }
  else if (val<0) {
    idx += 1;
  }

  idx = (idx + n)%n;
  g_innerlight.mode_index = idx;
  g_innerlight.mode = g_innerlight.modes[idx];


  if (/^tap_/.test(g_innerlight.mode)) {
    var radio_ele = document.getElementById("ui_mic_select");
    radio_ele.checked = false;
    radio_ele = document.getElementById("ui_tap_select");
    radio_ele.checked = true;
  }
  else if (/^mic_/.test(g_innerlight.mode)) {
    var radio_ele = document.getElementById("ui_mic_select");
    radio_ele.checked = true;
    radio_ele = document.getElementById("ui_tap_select");
    radio_ele.checked = false;
  }

  var ele = document.getElementById("ui_mode");
  ele.innerHTML = g_innerlight.mode;

  //animateCSS("ui_mode", "pulse");

  _send_state();
}

function _tap_select() {
  console.log(">>tap select");

  var m = g_innerlight.mode;
  if (/^mic_/.test(m)) {
    m = m.replace(/^mic_/, "tap_");
  }

  var idx=0;
  for (idx=0; idx<g_innerlight.modes.length; idx++) {
    if (g_innerlight.modes[idx] == m) { break; }
  }
  if (idx == g_innerlight.modes.length) { return; }

  g_innerlight.mode_index = idx;
  g_innerlight.mode = g_innerlight.modes[idx];

  var ele = document.getElementById("ui_mode");
  ele.innerHTML = g_innerlight.mode;

  _send_state();
}

function _mic_select() {
  console.log(">>mic select", g_innerlight.mode);

  var m = g_innerlight.mode;
  if (/^tap_/.test(m)) {
    m = m.replace(/^tap_/, "mic_");
  }

  var idx=0;
  for (idx=0; idx<g_innerlight.modes.length; idx++) {
    if (g_innerlight.modes[idx] == m) { break; }
  }
  if (idx == g_innerlight.modes.length) { return; }

  g_innerlight.mode_index = idx;
  g_innerlight.mode = g_innerlight.modes[idx];

  var ele = document.getElementById("ui_mode");
  ele.innerHTML = g_innerlight.mode;

  _send_state();
}

function _calc_bpm(dta) {
  var del_t = [];

  if (dta.length < 2) { return -1.0; }

  var ms_avg = 0;
  for (var ii=1; ii<dta.length; ii++) {
    ms_avg += (dta[ii] - dta[ii-1]);
  }
  ms_avg /= (dta.length-1);

  if (ms_avg < 1.0) { return -1.0; }
  return 60*1000/ms_avg;
}

function _tap_cancel() {

  console.log(">>cancel");

  if (g_innerlight.tap_progression_timeout !== null) {
    clearTimeout(g_innerlight.tap_progression_timeout);
    g_innerlight.tap_progression_timeout = null;
  }

  g_innerlight.tap_progression_last_ms = -1;
  g_innerlight.tap_progression_time = [ ];
  g_innerlight.tap_progression_numerator = 0;

  var ele = document.getElementById("ui_tap_progression_numerator");
  ele.innerHTML = "0";

  animateCSS("ui_tap_progression", "shake");
}

function _tap_commit() {
  if (g_innerlight.tap_progression_timeout !== null) {
    clearTimeout(g_innerlight.tap_progression_timeout);
    g_innerlight.tap_progression_timeout = null;
  }

  g_innerlight.tap_bpm = _calc_bpm(g_innerlight.tap_progression_time);
  _clamp_bpm();

  g_innerlight.tap_progression_last_ms = -1;
  g_innerlight.tap_progression_time = [ ];
  g_innerlight.tap_progression_numerator = 0;

  var ele = document.getElementById("ui_tap_slider");
  ele.value = Math.round(g_innerlight.tap_bpm);

  var ele = document.getElementById("ui_tap_bpm");
  ele.innerHTML = Math.round(g_innerlight.tap_bpm*100)/100;

  //animateCSS("ui_tap_bpm", "pulse");

  _send_state();
}

function _tap_button() {
  var dt = new Date();

  if (g_innerlight.tap_progression_timeout !== null) {
    clearTimeout(g_innerlight.tap_progression_timeout);
    g_innerlight.tap_progression_timeout = null;
  }

  var t_ms = dt.getTime();
  if (g_innerlight.tap_progression_last_ms < 0) {
    g_innerlight.tap_progression_last_ms = t_ms;
    g_innerlight.tap_progression_time = [ t_ms ];
    g_innerlight.tap_progression_numerator = 1;
  }
  else {
    g_innerlight.tap_progression_last_ms = t_ms;
    g_innerlight.tap_progression_time.push(t_ms);
    g_innerlight.tap_progression_numerator+=1;
  }

  var ele = document.getElementById("ui_tap_progression_numerator");
  ele.innerHTML = g_innerlight.tap_progression_numerator;

  if (g_innerlight.tap_progression_numerator >= 12) {
    _tap_commit();

  }
  else {
    g_innerlight.tap_progression_timeout =
      setTimeout(
          function() { _tap_cancel(); },
          g_innerlight.tap_progression_cancel_ms
          );
  }


}

function _tap_add() {
  console.log(">>tap add");

  g_innerlight.tap_bpm += 1.0;
  _clamp_bpm();

  var ele = document.getElementById("ui_tap_slider");
  ele.value = Math.round(g_innerlight.tap_bpm);

  var ele = document.getElementById("ui_tap_bpm");
  ele.innerHTML = Math.round(g_innerlight.tap_bpm*100)/100;

  _send_state();
}

function _tap_sub() {
  console.log(">>tap sub");

  g_innerlight.tap_bpm -= 1.0;
  _clamp_bpm();

  var ele = document.getElementById("ui_tap_slider");
  ele.value = Math.round(g_innerlight.tap_bpm);

  var ele = document.getElementById("ui_tap_bpm");
  ele.innerHTML = Math.round(g_innerlight.tap_bpm*100)/100;

  _send_state();
}

function _tap_slider(inp) {
  console.log(">>tap slider");

  var ele = document.getElementById("ui_tap_slider");
  console.log(ele.value);

  g_innerlight.tap_bpm = parseFloat(ele.value);
  _clamp_bpm();

  ele = document.getElementById("ui_tap_bpm");
  ele.innerHTML = Math.round(g_innerlight.tap_bpm*100)/100;

  _send_state();
}

function _option_slider(inp) {

  var ele = document.getElementById("ui_option_slider");

  console.log(">>option slider", ele.value);

  g_innerlight.option_value = parseInt(ele.value);

  _send_state();
}

function _color_primary(f_b, c) {
  var rgb = c.rgb;
  var update = false;

  if (f_b === "fg") {
    console.log("foreground");
    g_innerlight.color_fg[0] = Math.floor(rgb[0]);
    g_innerlight.color_fg[1] = Math.floor(rgb[1]);
    g_innerlight.color_fg[2] = Math.floor(rgb[2]);
    update=true;
  }
  else if (f_b === "bg") {
    console.log("background");
    g_innerlight.color_bg[0] = Math.floor(rgb[0]);
    g_innerlight.color_bg[1] = Math.floor(rgb[1]);
    g_innerlight.color_bg[2] = Math.floor(rgb[2]);
    update=true;
  }

  if (update) {
    _send_state();
  }
}

function _color(idx, c) {
  var rgb = c.rgb;
  console.log(">>color", idx, rgb[0], rgb[1], rgb[2]);

  if ((idx >= 0) && (idx < g_innerlight.color_map.length)) {
    g_innerlight.color_map[idx][0] = Math.floor(rgb[0]);
    g_innerlight.color_map[idx][1] = Math.floor(rgb[1]);
    g_innerlight.color_map[idx][2] = Math.floor(rgb[2]);
  }

  _send_state();
}

function _set_color_rgb(idx, rgb) {
  var ele = document.getElementById("ui_color" + idx);
  ele.jscolor.fromRGB(rgb[0], rgb[1], rgb[2]);
}

function _set_color_str(idx, c) {
  var ele = document.getElementById("ui_color" + idx);
  if ((c.length > 0) && (c[0] == '#')) { c = c.substr(1); }
  ele.jscolor.fromString(c);
}

function _color_preset(val) {

  var preset = [

    // oil slick rainbow
    //
    [ { "hex":"#e8bbc9", "rgb":[232,187,201] },
      { "hex":"#9a3e82", "rgb":[154,62,130] },
      { "hex":"#8cd1e0", "rgb":[140,209,224] },
      { "hex":"#224a8e", "rgb":[34,74,142] },
      { "hex":"#d5773d", "rgb":[213,119,61] } ],

    // deep oil slick rainbow
    //
    [
      { "hex":"#173f62", "rgb":[23,63,98] },
      { "hex":"#5b8f99", "rgb":[91,143,153] },
      { "hex":"#faab5c", "rgb":[250,171,92] },
      { "hex":"#bf3414", "rgb":[191,52,20] },
      { "hex":"#851826", "rgb":[133,24,38] } ],

    // oil ocean
    //
    [
      { "hex":"#0f0b38", "rgb":[15,11,56] },
      { "hex":"#222858", "rgb":[34,40,88] },
      { "hex":"#b825df", "rgb":[184,37,223] },
      { "hex":"#b6df5c", "rgb":[182,223,92] },
      { "hex":"#c5a74b", "rgb":[197,167,75] }
    ],

    // two cycle oil
    //
    [
      { "hex":"#dddddd", "rgb":[221,221,221] },
      { "hex":"#d8d8e0", "rgb":[216,216,224] },
      { "hex":"#b0b0b8", "rgb":[176,176,184] },
      { "hex":"#c82028", "rgb":[200,32,40] },
      { "hex":"#281010", "rgb":[40,16,16] }
    ],

    // oil painting
    //
    [
      { "hex":"#122147", "rgb":[18,33,71] },
      { "hex":"#1c542b", "rgb":[28,84,43] },
      { "hex":"#d6001d", "rgb":[214,0,29] },
      { "hex":"#f3f6eb", "rgb":[243,246,235] },
      { "hex":"#fbaf62", "rgb":[251,175,98] }
    ],

    // neo tokyo synth
    //
    [
      { "hex":"#55e7ff", "rgb":[85,231,255] },
      { "hex":"#00ccfd", "rgb":[0,204,253] },
      { "hex":"#ff34b3", "rgb":[255,52,179] },
      { "hex":"#2011a2", "rgb":[32,17,162] },
      { "hex":"#201148", "rgb":[32,17,72] }
    ],

    // synthwave sunset
    //
    [
      { "hex":"#ffd319", "rgb":[255,211,25] },
      { "hex":"#ff901f", "rgb":[255,144,31] },
      { "hex":"#ff2975", "rgb":[255,41,117] },
      { "hex":"#f222ff", "rgb":[242,34,255] },
      { "hex":"#8c1eff", "rgb":[140,30,255] }
    ],

    // outrun
    //
    [
      { "hex":"#00f3ff", "rgb":[0,243,255] },
      { "hex":"#ff0052", "rgb":[255,0,82] },
      { "hex":"#9e00ff", "rgb":[158,0,255] },
      { "hex":"#ffef00", "rgb":[255,239,0] },
      { "hex":"#3f3f3f", "rgb":[63,63,63] }
    ]

  ];

  if ((val>=0) && (val < preset.length)) {
    console.log(">>preset", preset[val]);

    g_innerlight.color_map = [];

    for (var ii=0; ii<5; ii++) {
      _set_color_str(ii, preset[val][ii].hex);


      g_innerlight.color_map.push( [ preset[val][ii].rgb[0], preset[val][ii].rgb[1], preset[val][ii].rgb[2] ] );

    }
  }

  console.log(">>color preset", val);

  _send_state();
}

function _init_load() {
  _color_preset(0);
  var ele = document.getElementById("ui_tap_bpm");
  ele.innerHTML = Math.round(g_innerlight.tap_bpm*100)/100;
  _mode(0);
}

function _wait_and_load(ele_id, val, cb) {
  var ele = document.getElementById(ele_id);
  if (val in ele) {
    cb();
  }
  else {
    setTimeout( (function(x,y,z) { return function() { _wait_and_load(x,y,z); } })(ele_id, val, cb), 100 );
  }
}

function _init() {
  //_wait_and_load("ui_color0", "jscolor", function() { _color_preset(0); });

  // !!!
  //_wait_and_load("ui_color0", "jscolor", _init_load);

  //_color_preset(0);

  //var ele = document.getElementById("ui_tap_progression");
  //ele.classList.add('animated', 'shake');

}

//---------

function animateCSS(ele_id, animationName, callback) {
  //const node = document.querySelector(element);
  const node = document.getElementById(ele_id);
  node.classList.add('animated', animationName);

  function handleAnimationEnd() {
    node.classList.remove('animated', animationName);
    node.removeEventListener('animationend', handleAnimationEnd);

    if (typeof callback === 'function') callback();
  }

  node.addEventListener('animationend', handleAnimationEnd);
}

function _bad_tempo() {
  var ele = document.getElementById("ui_tap_progression");
  animateCSS("ui_tap_progression", "shake");
}


//---------

$(document).ready(function() {
  _init();

  $("#body").addClass("load");

  //$("#colorpicker").farbtastic("#color");
  //$("#colorpicker").farbtastic(function(hex) { console.log(hex); });


  /*
  var colorpick = $('#dropper').iDropper({
    "color":"#ffffff",
    "layout":"ring",
    "size":125,
    onDrag: function(hex) { console.log(">>", hex); }
  });
  */

  //iDropperInstance = iDropperContainer.data("iDropper");


});

//_init();
