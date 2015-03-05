var SVGContainer = require('./svgcontainer');
var Promise = require('./promise');

function SVGNodeContainer(node, _native) {
    this.src = node;
    this.image = null;
    var self = this;
	var doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    this.promise = _native ? new Promise(function(resolve, reject) {
        self.image = new Image();
        self.image.onload = resolve;
        self.image.onerror = reject;
		var outer = document.createElement('div');
		node = _addStylesToSVG(node);
		outer.appendChild(node);
		node = doctype + outer.innerHTML;
        self.image.src = "data:image/svg+xml;base64," + window.btoa(unescape(encodeURIComponent(node)));
        if (self.image.complete === true) {
            resolve(self.image);
        }
    }) : this.hasFabric().then(function() {
        return new Promise(function(resolve) {
            window.html2canvas.svg.fabric.parseSVGDocument(node, self.createCanvas.call(self, resolve));
        });
    });
}

function _addStylesToSVG(svg) {
	var used = "";
	var sheets = document.styleSheets;
	for (var i = 0; i < sheets.length; i++) {
		var rules = sheets[i].cssRules;
		for (var j = 0; j < rules.length; j++) {
			var rule = rules[j];
			if (typeof(rule.style) !== 'undefined' && typeof(rule.selectorText) !== 'undefined') {
				var match = null;
				try {
					match = svg.querySelector(rule.selectorText);
				} catch (err) {
					console.warn('Invalid CSS selector: ' + rule.selectorText, err);
				}
				if (match) {
					var selectorGroup = rule.selectorText.split(/,\s+/);
					var selectorText = null;
					var selectorsFixed = [];
					for (var k = 0; k < selectorGroup.length; k++) {
						var selectors = selectorGroup[k].split(/[>+~ ]+/);
						for (var l = 0; l < selectors.length; l++) {
							if (svg.querySelector(selectors[l])) {
								selectorsFixed.push(selectorGroup[k].substring(selectorGroup[k].indexOf(selectors[l])));
								break;
							}
						}
					}
					selectorText = selectorsFixed.join(', ');
					console.log('Match Found: ' + rule.selectorText + '; selector text: ' + selectorText);
					used += selectorText + " { " + rule.style.cssText + " }\n";
				}
			}
		}
	}
	var s = document.createElement('style');
	s.setAttribute('type', 'text/css');
	s.innerHTML = '<![CDATA[\n' + used + '\n]]>';
	var defs = document.createElement('defs');
	defs.appendChild(s);
	svg.insertBefore(defs, svg.firstChild);
	svg.setAttribute('version', '1.1');
	svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
	svg.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');
	return svg;
}

SVGNodeContainer.prototype = Object.create(SVGContainer.prototype);

module.exports = SVGNodeContainer;
