// script 4, sprite.js
// Public Domain / CC0, MirceaKitsune 2016
// contains functions for creating and updating bars and sprites

// common objects
var bar_current = {};
var sprite_current = {};
var sprite_action = {};
var sprite_delay = {};

// converts a geometry string into style elements
// format: "left top width height z-index"
// note: when the z-index is negative, the element is attached for parallax effect
function get_geometry(string) {
	var box = string ? string.split(" ") : [];
	if (!box[0]) box[0] = "0%";
	if (!box[1]) box[1] = "0%";
	if (!box[2]) box[2] = "100%";
	if (!box[3]) box[3] = "100%";
	if (!box[4]) box[4] = null;
	var text =
		"position: absolute; " +
		"left: " + box[0] + "; " +
		"top: " + box[1] + "; " +
		"width: " + box[2] + "; " +
		"height: " + box[3] + "; " +
		"z-index: " + (box[4] ? box[4] : "auto") + "; " +
		"background-attachment: " + (box[4] < 0 ? "fixed" : "scroll") + "; " +
		"background-size: 100% 100%; ";
	return text;
}

// converts two colors and a percentage into a gradient
function get_gradient(color1, color2, direction, blend) {
	var text = "linear-gradient(" +
	"to " + direction + ", " +
	color1 + ", " +
	color1 + " " + blend + "%, " +
	color2 + " " + blend + "%, " +
	color2 + "); ";
	return text;
}

// sets the bar of a number variable
function bar_set(id, bar, value, parent, bar_def) {
	// if the element doesn't exist, create it
	var element = document.getElementById(id);
	if (!bar || !bar_def || !bar_def[bar]) {
		element && element.remove();
		delete bar_current[id];
		return;
	// if a sprite is not defined, erase the element
	} else if (!element) {
		element = document.createElement("div");
		element.setAttribute("id", id);
		delete bar_current[id];
	}

	var bar_new = bar_def[bar];
	bar_current[id] = bar_current[id] || {};

	// if the bar or value changed, set the new bar and value
	if (bar_current[id].bar != bar || bar_current[id].value != value) {
		// configure the visuals of this bar
		if (bar_new.layer) {
			var style = get_geometry(bar_new.layer.geometry);
			if (value <= 0) {
				style += "background-color: " + bar_new.layer.color2 + "; ";
			} else if (value >= 1) {
				style += "background-color: " + bar_new.layer.color1 + "; ";
			} else {
				style += "background-image: " + get_gradient(
					bar_new.layer.color1,
					bar_new.layer.color2,
					bar_new.layer.direction,
					(value * 100)
				);
			}

			if (bar_new.layer.alpha) {
				style += "opacity: " + bar_new.layer.alpha + "; ";
			}
			if (bar_new.layer.shape) {
				style += "border-radius: " + bar_new.layer.shape + "; ";
			}
		}

		// configure the text of this bar
		if (bar_new.text) {
			if (bar_new.text.align) {
				style += "text-align: " + bar_new.text.align + "; ";
			}
			if (bar_new.text.size) {
				style += "font-size: " + bar_new.text.size + "; ";
			}
			if (bar_new.text.weight) {
				style += "font-weight: " + bar_new.text.weight + "; ";
			}
			if (bar_new.text.family) {
				style += "font-family: " + bar_new.text.family + "; ";
			}
			if (bar_new.text.color) {
				style += "color: " + bar_new.text.color + "; ";
			}

			var prefix = bar_new.text.content_prefix || "";
			var suffix = bar_new.text.content_suffix || "";
			var value_multiplier = bar_new.text.content_multiplier;
			var value_text = value_multiplier ? Math.floor(value * value_multiplier) : value.toFixed(2);
			var text = prefix + value_text + suffix;
			element.innerText = text;
		}

		element.setAttribute("style", style);
		bar_current[id].bar = bar;
		bar_current[id].value = value;
	}

	// if the parent changed, set the new parent
	if (bar_current[id].parent != parent) {
		var element_parent = document.getElementById(parent);
		if (element_parent) {
			element_parent.appendChild(element);
		} else {
			canvas.appendChild(element);
		}
		bar_current[id].parent = parent;
	}
}

// sets the sprite of an element
function sprite_set(id, sprite, parent, sprite_def) {
	// if the element doesn't exist, create it
	var element = document.getElementById(id);
	if (!sprite || !sprite_def || !sprite_def[sprite]) {
		element && element.remove();
		delete sprite_current[id];
		return;
	// if a sprite is not defined, erase the element
	} else if (!element) {
		element = document.createElement("div");
		element.setAttribute("id", id);
		delete sprite_current[id];
	}

	var sprite_new = sprite_def[sprite];
	sprite_current[id] = sprite_current[id] || {};

	// if the sprite changed, set the layers from the new sprite
	if (sprite_current[id].sprite != sprite) {
		element.innerHTML = "";

		for (var layer in sprite_new) {
			var style = "";
			var style_pointer = false;
			var layer_new = sprite_new[layer];
			var layer_element = document.createElement("div");
			element.appendChild(layer_element);

			// configure the visuals of this layer
			if (layer_new.layer) {
				style += get_geometry(layer_new.layer.geometry);
				if (layer_new.layer.color) {
					style += "background-color: " + layer_new.layer.color + "; ";
				}
				if (layer_new.layer.image) {
					style += "background-image:" + layer_new.layer.image + "; ";
				}
				if (layer_new.layer.alpha) {
					style += "opacity: " + layer_new.layer.alpha + "; ";
				}
				if (layer_new.layer.shape) {
					style += "border-radius: " + layer_new.layer.shape + "; ";
				}
				if (layer_new.layer.cursor) {
					style += "cursor: " + layer_new.layer.cursor + "; ";
					style_pointer = true;
				}
			}

			// configure the text of this layer
			if (layer_new.text) {
				if (layer_new.text.align) {
					style += "text-align: " + layer_new.text.align + "; ";
				}
				if (layer_new.text.size) {
					style += "font-size: " + layer_new.text.size + "; ";
				}
				if (layer_new.text.weight) {
					style += "font-weight: " + layer_new.text.weight + "; ";
				}
				if (layer_new.text.family) {
					style += "font-family: " + layer_new.text.family + "; ";
				}
				if (layer_new.text.color) {
					style += "color: " + layer_new.text.color + "; ";
				}

				var text = layer_new.text.content;
				if (typeof text == "object") {
					var index = Math.floor(Math.random() * text.length);
					text = text[index];
				}

				// translate words beginning with $ into variables
				var table = text.split(/[^a-zA-Z0-9$_]+/); // anything that's not: a-z,A-Z,0-9,$,_
				for(var entry in table) {
					var entry1 = table[entry].substring(0, 1);
					if (entry1 == "$") {
						var entry2 = table[entry].substring(1);
						if (scene_data.variables[entry2] != null && scene_data.variables[entry2] != "undefined") {
							text = text.replace(table[entry], scene_data.variables[entry2]);
						}
					}
				}

				layer_element.innerText = text;
			}

			// configure the audio of this layer
			if (layer_new.audio) {
				audio_id = (typeof layer_new.audio.id == "string" && layer_new.audio.id != "undefined") ? layer_new.audio.id : "audio";
				audio = document.getElementById(audio_id);
				if (!audio) {
					audio = document.createElement("audio");
					audio.setAttribute("id", audio_id);
					canvas.appendChild(audio);
				}

				audio.src = layer_new.audio.sound;
				audio.volume = Number(layer_new.audio.volume);
				audio.loop = (layer_new.audio.loop == "true");
				audio.autoplay = true;
			}

			// configure the actions of this layer
			if (layer_new.actions) {
				var func_click = "";
				var func_hover_start = "";
				var func_hover_end = "";
				var func_load = [];
				var func_interval = [];

				for (var action in layer_new.actions) {
					var action_new = layer_new.actions[action];
					var action_id = id + "_" + layer + "_" + action;

					if(sprite_delay[action_id]) {
						clearTimeout(sprite_delay[action_id]);
					}
					delete sprite_delay[action_id];

					sprite_action[action_id] = action_new;
					switch (action_new.trigger) {
						case "click":
							func_click += "scene_action(\"" + action_id + "\", true, false); ";
							style_pointer = true;
							break;
						case "hover_start":
							func_hover_start += "scene_action(\"" + action_id + "\", true, false); ";
							style_pointer = true;
							break;
						case "hover_end":
							func_hover_end += "scene_action(\"" + action_id + "\", true, false); ";
							style_pointer = true;
							break;
						case "load":
							func_load.push(action_id);
							break;
						case "interval":
							func_interval.push(action_id);
							break;
						default:
							break;
					}
				}

				if (func_click != "") layer_element.setAttribute("onclick", func_click);
				if (func_hover_start != "") layer_element.setAttribute("onmouseover", func_hover_start);
				if (func_hover_end != "") layer_element.setAttribute("onmouseout", func_hover_end);
				for (var func_load_action in func_load) scene_action(func_load[func_load_action], false, false);
				for (var func_interval_action in func_interval) scene_action(func_interval[func_interval_action], false, false);
			}

			style += style_pointer ? "pointer-events: all; " : "pointer-events: none; ";
			layer_element.setAttribute("style", style);
			sprite_current[id].sprite = sprite;
		}
	}

	// if the parent changed, set the new parent
	if (sprite_current[id].parent != parent) {
		var element_parent = document.getElementById(parent);
		if (element_parent) {
			element_parent.appendChild(element);
		} else {
			canvas.appendChild(element);
		}
		sprite_current[id].parent = parent;
	}
}
