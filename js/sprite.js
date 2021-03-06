// script 4, sprite.js
// Public Domain / CC0, MirceaKitsune 2016
// contains functions for creating and updating sprites

// common objects
var sprite_distance_parent = {};
var sprite_distance = {};
var sprite_current = {};
var sprite_variable = {};
var sprite_action = {};
var sprite_delay = {};

// returns the distance of a geometry string, based on the z-index
function get_geometry_distance(string) {
	var box = string ? string.split(" ") : [];
	var distance = box[4] ? Number(box[4]) : 0;
	if(distance >= 0) {
		// normal falloff
		distance = 1 + distance;
	} else {
		// reverse falloff
		distance = 1 / (1 + Math.abs(distance));
	}
	return distance;
}

// converts a geometry string into style elements
// format: "left top width height z-index"
// note: when the z-index is negative, the element is attached for parallax effect
function get_geometry(string) {
	var box = string ? string.split(" ") : [];
	if(!box[0]) box[0] = "0%";
	if(!box[1]) box[1] = "0%";
	if(!box[2]) box[2] = "100%";
	if(!box[3]) box[3] = "100%";
	if(!box[4]) box[4] = null;
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

// replaces variable names with their values in a text field
// returns the modified text, optionally stores the variables of a sprite if its ID is given
function text_replace(text, id) {
	var vars = [];
	var table_all = text.split(/[^a-zA-Z0-9$_]+/); // anything that's not: a-z,A-Z,0-9,$,_
	for(var entry_all in table_all) {
		// table[1] is the variable name, table[2] is the optional visual multiplier
		var table = table_all[entry_all].split("$");
		if(typeof table[1] === "string" && table[1] !== "") {
			var value = scene_action_get("$" + table[1]);
			if(Number(value) !== NaN && Number(value) > 0) {
				value = Number(value);

				var multiplier = Number(table[2]);
				if(multiplier !== NaN && multiplier > 0) {
					value = value * multiplier;
					value = Math.floor(value) // treat as integer
				} else {
					value = value.toFixed(2); // treat as float, 2 decimals
				}
			}
			text = text.replace(table_all[entry_all], value);
			vars.push(table[1]);
		}
	}

	// if a sprite ID is given, store each variable that needs to be updated for this sprite
	if(typeof id === "string" && id !== "")
	{
		for(var variable in vars) {
			var name = vars[variable];
			if(name.substring(0, 5) === "date_" || name.substring(0, 5) === "time_") {
				sprite_variable[id][name] = "*"; // always update 
			} else if(scene_data.variables[name] !== null && scene_data.variables[name] !== undefined)
				sprite_variable[id][name] = scene_data.variables[name]; // update if changed
		}
	}

	return text;
}

// sets the sprite of an element
function sprite_set(id, sprite, parent, sprite_def) {
	var element_parent = document.getElementById(parent);
	if(!element_parent)
		return;

	// if the element doesn't exist, create it
	// if a sprite is not defined, erase the element instead
	var element = document.getElementById(id);
	if(!sprite || !sprite_def || !sprite_def[sprite]) {
		element && element.remove();
		delete sprite_current[id];
		return;
	} else if(!element) {
		element = document.createElement("div");
		element.setAttribute("id", id);
		element_parent.appendChild(element);
		delete sprite_current[id];
	}

	// decide whether to update the sprite, based on whether the sprite has changed or any tracked variable has been modified
	// 0 = no update, 1 = update visuals and actions, 2 = update visuals and actions and audio
	var update = 0;
	if(sprite_current[id] !== sprite) {
		update = 2;
	} else if(sprite_distance[id] !== sprite_distance_parent[parent]) {
		update = 2;
	} else {
		for(var variable in sprite_variable[id]) {
			var value1 = sprite_variable[id][variable];
			var value2 = scene_data.variables[variable];
			if(value1 === "*") {
				update = 1;
				break;
			} else if(value1 !== value2 && value2 !== null && value2 !== undefined) {
				update = 1;
				break;
			}
		}
	}

	// if we decided to update the sprite, set the layers from the new sprite
	if(update > 0) {
		element.innerHTML = "";
		sprite_current[id] = sprite;
		sprite_distance[id] = sprite_distance_parent[parent];
		sprite_variable[id] = {};

		// delete all sprite actions associated with this sprite
		for(var entry in sprite_action) {
			if(entry.substring(0, id.length) === id)
				delete sprite_action[entry];
		}

		// begin looping through the layers of the new sprite
		for(var layer in sprite_def[sprite]) {
			var style = "";
			var style_pointer = false;
			var layer_element = document.createElement("div");
			element.appendChild(layer_element);

			// if an inherited layer is set, first copy that layer then override its options with our layer's options where they are available
			// note that entry replacements inside object go one level deep, objects within objects are overridden
			var layer_this = sprite_def[sprite][layer];
			var layer_new = Object.assign({}, layer_this); // copy the object, don't reference it
			if(typeof layer_this.inherit === "object") {
				var inherit_sprite = get_random(layer_this.inherit.sprite);
				var inherit_layer = Number(get_random(layer_this.inherit.layer)) - 1;
				if(typeof sprite_def[inherit_sprite] === "object" && typeof sprite_def[inherit_sprite][inherit_layer] === "object") {
					layer_new = Object.assign({}, sprite_def[inherit_sprite][inherit_layer]); // copy the object, don't reference it
					for(var level1 in layer_this) {
						if(Array.isArray(layer_this[level1])) {
							layer_new[level1] = layer_new[level1] || [];
							layer_new[level1] = layer_new[level1].concat(layer_this[level1]);
						} else if(typeof layer_this[level1] === "object") {
							layer_new[level1] = layer_new[level1] || {};
							layer_new[level1] = Object.assign(layer_new[level1], layer_this[level1]);
						} else {
							layer_new[level1] = layer_this[level1];
						}
					}
				}
			}

			// configure the geometries of all specified mods
			for(var mod in layer_new.geometries) {
				var geometry = get_random(layer_new.geometries[mod]);

				// set the geometry of the mod's element to the new geometry
				var mod_element = document.getElementById(mod);
				if(mod_element)
					mod_element.setAttribute("style", get_geometry(geometry));

				// set the distance of this mod for use by child sprites
				sprite_distance_parent[mod] = get_geometry_distance(geometry);
			}

			// configure the visuals of this layer
			if(layer_new.layer) {
				style += get_geometry(layer_new.layer.geometry);

				// choose whether to draw a gradient image, or a normal background color plus image
				if(layer_new.layer.gradient) {
					var color1 = (layer_new.layer.gradient.color1 !== null && layer_new.layer.gradient.color1 !== undefined) ? layer_new.layer.gradient.color1 : "#ffffff";
					var color2 = (layer_new.layer.gradient.color2 !== null && layer_new.layer.gradient.color2 !== undefined) ? layer_new.layer.gradient.color2 : "#000000";
					var direction = (layer_new.layer.gradient.direction !== null && layer_new.layer.gradient.direction !== undefined) ? layer_new.layer.gradient.direction : "right";
					var value_name = layer_new.layer.gradient.value.substring(1);
					var value = layer_new.layer.gradient.value;
					if(scene_data.variables[value_name] !== null && scene_data.variables[value_name] !== undefined) {
						value = scene_data.variables[value_name];
						sprite_variable[id][value_name] = value; // track this variable
					}

					if(value <= 0)
						style += "background-color: " + color2 + "; ";
					else if(value >= 1)
						style += "background-color: " + color1 + "; ";
					else
						style += "background-image: " + get_gradient(color1, color2, direction, (value * 100));
				} else {
					if(layer_new.layer.color)
						style += "background-color: " + layer_new.layer.color + "; ";
					if(layer_new.layer.image)
						style += "background-image:" + layer_new.layer.image + "; ";
				}
				if(layer_new.layer.alpha)
					style += "opacity: " + layer_new.layer.alpha + "; ";
				if(layer_new.layer.shadow)
					style += "box-shadow: " + layer_new.layer.shadow + "; ";
				if(layer_new.layer.shape)
					style += "border-radius: " + layer_new.layer.shape + "; ";
				if(layer_new.layer.cursor) {
					style += "cursor: " + layer_new.layer.cursor + "; ";
					style_pointer = true;
				}
			}

			// configure the text of this layer
			if(layer_new.text) {
				if(layer_new.text.align)
					style += "text-align: " + layer_new.text.align + "; ";
				if(layer_new.text.shadow)
					style += "text-shadow: " + layer_new.text.shadow + "; ";
				if(layer_new.text.size)
					style += "font-size: " + layer_new.text.size + "; ";
				if(layer_new.text.weight)
					style += "font-weight: " + layer_new.text.weight + "; ";
				if(layer_new.text.family)
					style += "font-family: " + layer_new.text.family + "; ";
				if(layer_new.text.color)
					style += "color: " + layer_new.text.color + "; ";

				var text = get_random(layer_new.text.content);
				layer_element.innerText = text_replace(text, id);
			}

			// configure the tooltip of this layer
			if(layer_new.tooltip)
			{
				var tooltip = get_random(layer_new.tooltip);
				layer_element.title = text_replace(tooltip, id);
				style_pointer = true;
			}

			// configure the audio of this layer
			if(layer_new.audio && update > 1) {
				var audio_id = (layer_new.audio.id !== undefined) ? layer_new.audio.id : "audio";
				var audio_element = document.getElementById(audio_id);
				if(!audio_element) {
					audio_element = document.createElement("audio");
					audio_element.setAttribute("id", audio_id);
					canvas.appendChild(audio_element);
				}

				var sound = get_random(layer_new.audio.sound);
				audio_element.setAttribute("src", sound);
				audio_element.setAttribute("volume", layer_new.audio.volume); // set later
				if(layer_new.audio.loop === "true")
					audio_element.setAttribute("loop", true);
				audio_element.setAttribute("autoplay", true);

				// set the volume based on distance
				var distance = (layer_new.audio.distance && sprite_distance[id]) ? Math.pow(sprite_distance[id], layer_new.audio.distance) : 1;
				audio_element.volume = Math.min(Number(layer_new.audio.volume) * distance, 1);
			}

			// configure the actions of this layer
			if(layer_new.actions) {
				var func_click = "";
				var func_hover_start = "";
				var func_hover_end = "";
				var func_load = [];
				var func_interval = [];

				for(var action in layer_new.actions) {
					var action_new = layer_new.actions[action];
					var action_id = id + "_" + layer + "_" + action;

					if(sprite_delay[action_id])
						clearTimeout(sprite_delay[action_id]);
					delete sprite_delay[action_id];

					sprite_action[action_id] = action_new;
					switch(action_new.trigger) {
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

				if(func_click !== "")
					layer_element.setAttribute("onclick", func_click);
				if(func_hover_start !== "")
					layer_element.setAttribute("onmouseover", func_hover_start);
				if(func_hover_end !== "")
					layer_element.setAttribute("onmouseout", func_hover_end);
				for(var func_load_action in func_load)
					scene_action(func_load[func_load_action], false, false);
				for(var func_interval_action in func_interval)
					scene_action(func_interval[func_interval_action], false, false);
			}

			style += style_pointer ? "pointer-events: all" : "pointer-events: none";
			layer_element.setAttribute("style", style);
		}
	}
}
