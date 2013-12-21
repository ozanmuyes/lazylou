/*
 * Lazylou version 1.0.0
 * Ozan Müyesseroğlu
 *
 * http://www.ozanmuyes.com
 * dialog@ozanmuyes.com
 *
 */

/* Pre-requests */

	$.lazylouLoadImage = function(url) {

		// Define a "worker" function that should eventually resolve or reject the deferred object.
		var lazylouLoadImage = function(deferred) {

			var m_Image = new Image();

			// Set up event handlers to know when the image has loaded
			// or fails to load due to an error or abort.
			m_Image.onload = onLoad;
			m_Image.onerror = onError; // URL returns 404, etc
			m_Image.onabort = onError; // IE may call this if user clicks "Stop"

			// Setting the src property begins loading the image.
			m_Image.src = url;

			function onLoad() {

				unbindEvents();

				// Calling resolve means the image loaded sucessfully and is ready to use.
				deferred.resolve(m_Image);

			}

			function onError() {

				unbindEvents();

				// Calling reject means we failed to load the image (e.g. 404, server offline, etc).
				deferred.reject(m_Image);

			}

			function unbindEvents() {

				// Ensures the event callbacks only get called once.
				m_Image.onload = null;
				m_Image.onerror = null;
				m_Image.onabort = null;

			}

		};

		// Create the deferred object that will contain the loaded image.
		// We don't want callers to have access to the resolve() and reject() methods,
		// so convert to "read-only" by calling `promise()`.
		return $.Deferred(lazylouLoadImage).promise();

	};

/* Plugin - Authoring */

	;(function($, window, document, undefined) {

		/* Consts */

			// TODO change plugin name
			var PLUGIN_NAME = 'lazylou';

		/* Variables */

			// TODO şimdilik kullanılmıyor, kodlarını yaz
			var m_ElementsCount = 0;

			/**
			 * This variable holds the name and IDs that under the same name
			 * to show image on all name related elements via their ID's.
			 * The structure of array is something like;
			 * m_Names["name_1"] = [0, 1, 2]
			 * m_Names["name_2"] = [3, 4]
			 * @type {Array}
			 */
			var m_Names = [];

			var m_Counter = 0;

		/* Ctor */

			function lazylou(p_Element, p_Options) {

				var self = this;
				self.element = p_Element;
				var c_Element = $(p_Element);

				// This next line takes advantage of HTML5 data attributes
				// to support customization of the plugin on a per-element
				// basis. For example,
				// <div class=item' data-PLUGIN_NAME='{"message": "Hello World!"}'></div>
				// REMARKS: See double quote to single quote substitution.
				self.metadata = c_Element.data(PLUGIN_NAME + "-options");

				// jQuery has an extend method that merges the
				// contents of two or more objects, storing the
				// result in the first object. The first object
				// is generally empty because we don't want to alter
				// the default options for future instances of the plugin
				// REMARK jQuery properties overrides HTML data
				self.options = $.extend({}, $.fn[PLUGIN_NAME].defaults, self.metadata, p_Options);

				// Override HTML data to self.options
				$.each(self.options, function(p_Name, p_Value) {

					p_DataName = transformDataName(p_Name);

					if (typeof(c_Element.data(PLUGIN_NAME + "-options-" + p_DataName)) === "undefined")
						return;

					self.options[p_Name] = c_Element.data(PLUGIN_NAME + "-options-" + p_DataName);

				});

				c_Element.attr("data-lazylou-id", m_ElementsCount);
				self.options._id = m_ElementsCount++;
				if (self.options.name !== null) {

					if (typeof(m_Names[self.options.name]) === "undefined")
						m_Names[self.options.name] = new Array();

					m_Names[self.options.name][m_Names[self.options.name].length] = self.options._id;

				}

				self.options._cssSelector = getCSSSelector(p_Element) + "[data-lazylou-id=" + self.options._id + "]";
				// Calculate/translate spriteIndex and replace with the existing one
				self.options.spriteIndex = translateSpriteIndex(self);

				if (self.options.src === null && self.options.name === null) {

					console.log(PLUGIN_NAME + ".js | Error | ID=" + self.options._cssSelector + " | Element has no src nor name to load an image.");

					// terminate init. process
					return null;

				}

				// If should element's data be cleaned up, start the procedure
				// immediately after meta-data importation
				if (self.options.cleanUp) {

					var c_Data = c_Element.data();
					var c_TempDataName = "";

					$.each(c_Data, function(p_Name, p_Value) {

						if (p_Name.indexOf(PLUGIN_NAME) !== 0 || p_Name === "lazylouId")
							return;

						c_TempDataName = transformDataName(p_Name);

						c_Element.attr("data-" + c_TempDataName, null)
							.removeData(c_TempDataName);

					});

				}

				// If sprite dimensions not set via HTML data or jQuery, assign dimensions element's size
				// if (self.options.spriteDimension.width === -1 || self.options.spriteDimension.height === -1)
				// 	self.options.spriteDimension = {width: c_Element.width(), height: c_Element.height()};
				//
				// Do NOT activate the obsolete code above

				// TODO add element's initialization code here

				if (self.options.src !== "" && self.options.src !== null)
					if (self.options.autoStart)
						loadImage(self);

				// Do inner clean up
				delete c_Element;
				delete self.metadata;

				m_Counter++;

				if (self.options.verbose)
					console.log(PLUGIN_NAME + ".js | ID=" + self.options._cssSelector + " | Element initialization is complete.");

				self.options.onInitialized();
				dispatchCallback(self, "Initialized");

			};

		/* Private Functions */

			/**
			 * Returns element's CSS-like selector string
			 * @param  {string, DOM element} p_Element The element that selector's requested.
			 * @param  {string} p_Pattern Selector string return pattern. Following list explains pattern abbreviations
			 *					$ is for tag name
			 *					# is for ID
			 *					. is for class(es)
			 *					[] is for all attributes
			 *					[attr1, attr2] is for just attr1 and attr2 attributes (if they are exist)
			 *					[!data1] is for immediately return data VALUE
			 *					* is for all (all above included - even [])
			 * @return {string}           CSS-like selector string.
			 */
			function getCSSSelector(p_Element, p_Pattern) {

				var c_Element = null;

				switch (typeof(p_Element)) {

					case "undefined":
						return null;

					case "string":
						c_Element = $(p_Element);
						if (!c_Element.length)
							return null;
						break;

					case "object":
						if (!p_Element.length)
							if ($(p_Element).length === 0)
								return null;
							else
								c_Element = $(p_Element);
						else
							c_Element = p_Element;
						break;

				}

				if (typeof(p_Pattern) === "undefined" || p_Pattern === "")
					p_Pattern = "$#.";
				else if (p_Pattern === "*")
					p_Pattern = "$#.[]";

				// begin adding selector informations by pattern
				//
				var c_Selector = "";

				// tag name
				//
				if (p_Pattern.indexOf("$") !== -1)
					c_Selector += c_Element.prop("tagName").toLowerCase();

				// ID
				//
				if (p_Pattern.indexOf("#") !== -1 && typeof(c_Element.attr("id")) !== "undefined")
					c_Selector += "#" + c_Element.attr("id");

				// class(es)
				//
				if (p_Pattern.indexOf(".") !== -1) {

					var c_Classes = c_Element.attr("class");

					if (typeof(c_Classes) !== "undefined") {

						c_Classes = c_Classes.split(" ");

						for (var i = 0; i < c_Classes.length; i++)
							c_Selector += (c_Classes[i] !== "" ? "." + c_Classes[i] : "");

					}

				}

				// attributes
				//
				var c_AttributesStartIndex = p_Pattern.indexOf("[");
				var c_AttributesEndIndex = p_Pattern.indexOf("]");

				if (c_AttributesStartIndex !== -1 && c_AttributesEndIndex !== -1) {

					if (c_AttributesEndIndex - c_AttributesStartIndex === 1) {

						// all attributes

						$.each(c_Element[0].attributes, function(p_Index, p_Attr) {

							if (p_Attr.name === "id" || p_Attr.name === "class")
								return;

							c_Selector += "[" + p_Attr.name + "='" + p_Attr.value + "']";

						});

					} else {

						var c_Attributes = p_Pattern.substring(c_AttributesStartIndex + 1, c_AttributesEndIndex).split(",");
						var c_AttributesLength = c_Attributes.length;

						for (var c_AttrIndex = 0; c_AttrIndex < c_AttributesLength; c_AttrIndex++) {

							if (c_Attributes[c_AttrIndex].substring(0, 1) === "!")
								return c_Element.attr(c_Attributes[c_AttrIndex].substring(1));

							if (typeof(c_Element.attr(c_Attributes[c_AttrIndex])) === "undefined")
								continue;

							c_Selector += "[" + c_Attributes[c_AttrIndex] + "='" + c_Element.attr(c_Attributes[c_AttrIndex]) + "']";

						}

					}

				}

				return c_Selector;

			};

			// WARN This function returns lazylou-spriteDimension when lazylouSprite-dimension passed
			function transformDataName(p_Name) {

				var c_Length = p_Name.length;
				var c_Name = "";

				for (var i = 0; i < c_Length; i++) {

					if (p_Name[i] === "-")
						c_Name += p_Name[++i].toUpperCase();
					else if (p_Name[i].toUpperCase() === p_Name[i])
						c_Name += "-" + p_Name[i].toLowerCase();
					else
						c_Name += p_Name[i];

				}

				return c_Name;

			};

			function loadImage(p_Self) {

				$.lazylouLoadImage(p_Self.options.src).done(function(p_Image) {

					showImage(p_Self, p_Image);

					// TODO show image on all elements that registered for that particular name - propagate loaded image

					p_Self.options["onFinished"].call();
					dispatchCallback(p_Self, "ImageLoaded");

				});

			};

			function showImage(p_Self, p_Image) {

				p_Self.options.imageDimension = {width: p_Image.width, height: p_Image.height};

				// // $(p_Self.element).css("background-position", calculateBackgroundPosition(p_Self, "px"))
				// $(p_Self.element).css("background-position", $.fn[PLUGIN_NAME].calculateBackgroundPosition(p_Self, "px"))
				// 	.css("background-size", "100% auto")
				// 	.css("background-image", "url('" + p_Image.src + "')");
				// 	// .css("background-image", "url('" + p_Self.options.src + "')");

				var c_ElementsToUpdate = m_Names[p_Self.options.name];

				if (typeof(c_ElementsToUpdate) === "undefined") {

					// name-less element

					c_ElementsToUpdate = new Array();
					c_ElementsToUpdate[0] = p_Self.options._id;

				}

				var c_ElementsCount = c_ElementsToUpdate.length;
				var c_ElementData = null;

				for (var i = 0; i < c_ElementsCount; i++) {

					c_ElementData = $("[data-lazylou-id=" + c_ElementsToUpdate[i] + "]").data("lazylou");

					c_ElementData.options.src = p_Image.src;
					c_ElementData.options.imageDimension = {width: p_Image.width, height: p_Image.height};

					$("[data-lazylou-id=" + c_ElementsToUpdate[i] + "]")
						.css(
							"background-position",
							$.fn[PLUGIN_NAME].calculateBackgroundPosition(c_ElementData, "px")
						)
						.css("background-image", "url('" + p_Image.src + "')");

					var c_BackgroundSizeX = (c_ElementData.options._imageHorizontalSpriteCount * 100);
					var c_BackgroundSizeY = (c_ElementData.options._imageVerticalSpriteCount * 100);

					$("[data-lazylou-id=" + c_ElementsToUpdate[i] + "]").css(
						"background-size",
						(c_BackgroundSizeX === 0 ? "auto" : c_BackgroundSizeX + "%") + " " + (c_BackgroundSizeY === 0 ? "auto" : c_BackgroundSizeY + "%")
					);

				}

			};

			function translateSpriteIndex(p_Self, p_SpriteIndex) {

				var c_SpriteIndex = "";

				if (p_Self !== null && typeof(p_Self) === "object")
					c_SpriteIndex = p_Self.options.spriteIndex.toString();
				else {

					if (typeof(p_SpriteIndex) === "undefined") {

						console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | Can NOT translate the sprite index.");

						return 0;

					}

					c_SpriteIndex = p_SpriteIndex;

				}

				var c_SpriteIndexLenght = c_SpriteIndex.length;
				var c_Return = "";

				for (var i = 0; i < c_SpriteIndexLenght; i++) {

					// If current charactes is integer actually, add it to the c_Return and continue
					//
					if (47 < c_SpriteIndex.charCodeAt(i) && c_SpriteIndex.charCodeAt(i) < 58) {

						c_Return += c_SpriteIndex[i];

						continue;

					}

					switch (c_SpriteIndex[i]) {

						case "%": {

							// look for the next character and increase the i variable by 1

							switch (c_SpriteIndex[++i]) {

								case "C": // LazyLou counter variable value
									c_Return += m_Counter;
									break;

								case "I": // General index of particular element
									c_Return += p_Self.options._id;
									break;

								case "i":  // Element index among the siblings in current sequence
									c_Return += p_Self.options._siblingID;
									break;

							}

							break;

						}

						case "[": {

							var c_SpriteIndexes = "";
							var c_CloseBracketIndex = c_SpriteIndex.indexOf("]");

							if (c_CloseBracketIndex === -1) {

								console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | Element's spriteIndex property is not properly assigned. Syntax error found. Calculated index will be return.");

								return c_Return;

							}

							c_SpriteIndexes = c_SpriteIndex.substring(i + 1, c_CloseBracketIndex - i).replace(/\s+/g, '').split(",");

							return translateSpriteIndex(null, c_SpriteIndexes[p_Self.options._siblingID]);

						}

					}

				}

				return parseInt(c_Return, 10);

			};

			function dispatchCallback(p_Self, p_CallbackName, p_Parameters) {

				var c_AddonsCount = $.fn[PLUGIN_NAME]._addons.length;

				if (typeof(p_CallbackName) === "undefined" || c_AddonsCount === 0)
					return;

				for (var i = 0; i < c_AddonsCount; i++)
					$.fn[PLUGIN_NAME]._addons[i].receiveCallback(p_Self, p_CallbackName, p_Parameters);

			};

		// A really lightweight plugin wrapper around the constructor, preventing against multiple instantiations.
		//
		$.fn[PLUGIN_NAME] = function(p_Options) {

			if (!$.fn[PLUGIN_NAME].loadingImageLoaded) {

				// TODO first of all load loading image

				$.lazylouLoadImage("img/loading.gif").done(function(p_Image) {

					$.fn[PLUGIN_NAME].loadingImageLoaded = true;

				});

			}

			var c_Callers = this;
			var c_CallersCount = c_Callers.length;

			// TODO TEST HERE

			for (var i = 0; i < c_CallersCount; i++) {

				$(c_Callers[i]).css("background-repeat", "no-repeat")
					.css("background-position", "center center")
					.css("background-image", 'url("img/loading.gif")');

				if (c_CallersCount > 1) {

					// this is a sequence, to initiate lazylou in a row many times

					var c_SiblingID = {"_siblingID": i};
					p_Options = $.extend(p_Options, c_SiblingID);

				}

				if (!$.data(c_Callers[i], PLUGIN_NAME))
					$.data(c_Callers[i], PLUGIN_NAME, new lazylou(c_Callers[i], p_Options));

			}

			return c_Callers[0];

		};

		$.fn[PLUGIN_NAME].PLUGIN_NAME = "lazylou";

		$.fn[PLUGIN_NAME].loadingImageLoaded = false;

		$.fn[PLUGIN_NAME].defaults = {

			/* Variables */

				/* Public */

					// These variables are required values from user and/or
					// optional variables.

					/**
					 * Indicates whether all debug informations will be logged or not.
					 * @type {Boolean}
					 */
					verbose: true,

					/**
					 * If element's size is 0x0 (so not assigned by CSS nor jQuery/javascript)
					 * this function will be referred to whether try to gather spriteDimension
					 * if set, or to show some error.
					 * @type {Boolean}
					 */
					autoAdjustElementSize: true,

					/**
					 * In case of unable-to-gather-spriteDimension from options, if element's
					 * size is set, assign it to the spriteDimension.
					 * @type {Boolean}
					 */
					autoAdjustSpriteSize: true,

					/**
					 * The variable to hold image name to use multiple elements registered
					 * for that name. Also it's value will be stored in m_Names[] array.
					 * @type {[type]}
					 */
					name: null,
					/**
					 * Indicates image source path.
					 * @type {String}
					 */
					src: null,
					spriteDimension: {width: -1, height: -1},

					/**
					 * Image index among sprites
					 * @type {Number}
					 */
					spriteIndex: -1,

					/**
					 * If set to TRUE all images on HTML will be loaded after initialization.
					 * @type {Boolean}
					 */
					autoStart: true,

					/**
					 * Determines whether data (which has been holding by lazylou.m_Elements to trace individual
					 * elements) will be romeved after all images loaded in a plugin call or not.
					 * @type {Boolean}
					 */
					cleanUp: true,

				/* Private - Just Naming */

					_id: -1,
					/**
					 * The index of the element among all other siblings in a lazylou call sequence
					 * For example;
					 * $("body > div.image").lazylou(...); call made and the element is the second
					 * child of BODY, thus assign _siblingID to 1 (due to 0-based ID counter)
					 * @type {Number}
					 */
					_siblingID: 0, // NOTE _siblingID has to be 0 before initialization, so do NOT assign it -1

					_imageDimension: {width: -1, height: -1},

					/**
					 * This variable indicates number of the vertical sprites count.
					 * NOT to be change manually.
					 * -1 means not calculated yet.
					 * @type {Number}
					 */
					_imageVerticalSpriteCount: -1,
					/**
					 * This variable indicates number of the horizontal sprites count.
					 * NOT to be change manually.
					 * -1 means not calculated yet.
					 * @type {Number}
					 */
					_imageHorizontalSpriteCount: -1,

					_spriteVerticalIndex: -1,
					_spriteHorizontalIndex: -1,

					_cssSelector: null,

			/* Callbacks */

				onInitialized: function() {},
				onFinished: function() {}

		};

		$.fn[PLUGIN_NAME]._addons = [];

		$.fn[PLUGIN_NAME].calculateBackgroundPosition = function(p_Self, p_CSSUnit, p_CalculateAnyway) {

			if (typeof(p_CSSUnit) === "undefined")
					p_CSSUnit = null;

			if (p_Self.options.src === null) {

				console.log(PLUGIN_NAME + ".js | Warning | ID=" + p_Self.options._cssSelector + " | Terminating calculation, because of image has NOT been loaded yet.");

				return (p_CSSUnit === null
					? {x: 0, y: 0}
					: "0" + p_CSSUnit + " 0"  + p_CSSUnit);

			}

			if (typeof(p_CalculateAnyway) === "undefined")
				p_CalculateAnyway = false;

			if (p_Self.options.spriteDimension.width === -1 || p_Self.options.spriteDimension.height === -1) {

				// Try to look up and gather from registered name property's spriteDimension
				//
				if (p_Self.options.name !== null && typeof(m_Names[p_Self.options.name]) !== "undefined") {

					// Image's parent has been found.

					p_Self.options.spriteDimension = $("[data-lazylou-id=" + m_Names[p_Self.options.name][0] + "]").data("lazylou").options.spriteDimension;

				} else {

					if (p_Self.options.spriteIndex !== 0) {

						// try to gather spriteDimension from current viewport size

						if (!p_Self.options.autoAdjustSpriteSize)
							console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | Background position can NOT be calculate due to lack of sprite dimension information. \"0x0\" will be returned from calculateBackgroundPosition().");
						else {

							// WARN buradan 0x0 döndürülebilir
							p_Self.options.spriteDimension = {width: p_Self.element.offsetWidth, height: p_Self.element.offsetHeight};

						}

					}

				}

				if (p_Self.options.spriteDimension.width === -1 || p_Self.options.spriteDimension.height === -1)
					return (p_CSSUnit === null
						? {x: 0, y: 0}
						: "0" + p_CSSUnit + " 0"  + p_CSSUnit);

			}

			if ($(p_Self.element).width() === 0 || $(p_Self.element).height() === 0) {

				// It means element's size 0x0, nx0 or 0xm - expand the element based on spriteDimension (if set)

				if (!p_Self.options.autoAdjustElementSize || p_Self.options.spriteDimension.width === -1 || p_Self.options.spriteDimension.height === -1) {

					console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | Element's dimension and spriteDimension property can NOT be undefined at the sametime to calculate background position. Terminating function by returning \"null\"");

					return null;

				}

				$(p_Self.element).css("width", p_Self.options.spriteDimension.width + "px");
				$(p_Self.element).css("height", p_Self.options.spriteDimension.height + "px");

			} else {

				var c_DimensionsRatio = (
					($(p_Self.element).width() / $(p_Self.element).height()) /
					(p_Self.options.spriteDimension.width / p_Self.options.spriteDimension.height)
				);

				if (c_DimensionsRatio !== 1) {

					console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | Viewport's aspect ratio doesn't meet the sprite's aspect ratio. This occured because of poor responsive design.");

					return null;

				}

			}

			var c_DimensionMultiplier = ($(p_Self.element).width() / p_Self.options.spriteDimension.width);
			var c_DimensionalIndexes = $.fn[PLUGIN_NAME].gatherDimensionalIndexes(p_Self, p_CalculateAnyway);
			// var c_DimensionalIndexes = gatherDimensionalIndexes(p_Self);

			var c_X = c_DimensionalIndexes.horizontal * p_Self.options.spriteDimension.width * c_DimensionMultiplier;
			var c_Y = c_DimensionalIndexes.vertical * p_Self.options.spriteDimension.height * c_DimensionMultiplier;

			if (p_Self.options.verbose)
				console.log(PLUGIN_NAME + ".js | ID=" + p_Self.options._cssSelector + " | Background position re-calculated as " + c_X + "x" + c_Y + ".");

			c_X = (c_X * -1);
			c_Y = (c_Y * -1);

			// $(p_Self.element).css("background-position",  c_X + "px " + c_Y + "px");

			return (p_CSSUnit === null
				? {x: c_X, y: c_Y}
				: c_X + p_CSSUnit + " " + c_Y + p_CSSUnit);

		};

		$.fn[PLUGIN_NAME].gatherDimensionalIndexes2 = function(p_Self, p_CalculateAnyway) {

			// NOTE This function has to be called by loadImage(), after image has been loaded.
			//      For once.

			if (p_Self.options.verbose)
				console.log(PLUGIN_NAME + ".js | ID=" + p_Self.options._cssSelector + " | Dimensional indexes re-calculating...");

			if (typeof(p_CalculateAnyway) === "undefined")
				p_CalculateAnyway = false;

			if (!p_CalculateAnyway)
				if (p_Self.options._spriteHorizontalIndex > -1 && p_Self.options._spriteVerticalIndex > -1)
					return {horizontal: p_Self.options._spriteHorizontalIndex, vertical: p_Self.options._spriteVerticalIndex};

			var c_ImageDimension = p_Self.options.imageDimension;

			if (c_ImageDimension === undefined || c_ImageDimension.width === -1 || c_ImageDimension.height === -1) {

				console.log(PLUGIN_NAME + ".js | Warning | ID=" + p_Self.options._cssSelector + " | Due to image has NOT been loaded yet, image dimension can NOT used to gather indexes. Exiting from gatherDimensionalIndexes().");

				return {horizontal: 0, vertical: 0};

			}

			var c_SpriteDimension = p_Self.options.spriteDimension;
			var c_ViewportDimension = p_Self.options.viewportDimension;

			if (c_SpriteDimension.width === -1 || c_SpriteDimension.height === -1) {

				console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | Sprite dimensions must be set in order to use spriteIndex property.");

				return {horizontal: 0, vertical: 0};

			}

			if (p_Self.options._imageVerticalSpriteCount === -1 || p_Self.options._imageHorizontalSpriteCount === -1) {

				// calculate and set p_Self.options._imageVerticalSpriteCount and p_Self.options._imageHorizontalSpriteCount

				// obtain rule (either "go right" or "go down")
				//
				p_Self.options._imageHorizontalSpriteCount = (c_ImageDimension.width / c_SpriteDimension.width);
				p_Self.options._imageVerticalSpriteCount = (c_ImageDimension.height / c_SpriteDimension.height);

			}

			var c_SpritesCount = p_Self.options._imageHorizontalSpriteCount * p_Self.options._imageVerticalSpriteCount;
			var c_SpriteIndex = parseInt(p_Self.options.spriteIndex, 10);

			// TODO check if c_SpriteIndex is NaN. If so give error and exit funtion by returning {width: 0, height:0}

			if (c_SpriteIndex === 0) {

				p_Self.options._spriteHorizontalIndex = 0;
				p_Self.options._spriteVerticalIndex = 0;

				return {horizontal: p_Self.options._spriteHorizontalIndex, vertical: p_Self.options._spriteVerticalIndex};

			} else if (c_SpriteIndex > c_SpritesCount) {

				console.log(PLUGIN_NAME + ".js | Warning | ID=" + p_Self.options._cssSelector + " | Sprite index is greater that sprite(s) count. Sprite index will set to 0.");

				c_SpriteIndex = 0;
				p_Self.options._spriteHorizontalIndex = 0;
				p_Self.options._spriteVerticalIndex = 0;

				return {horizontal: p_Self.options._spriteHorizontalIndex, vertical: p_Self.options._spriteVerticalIndex};

			} else {

				// spriteIndex is greater than 0 and less than sprite(s) count

				// First check status on horizontal due to "go right" rule-candidate priority.
				if (p_Self.options._imageHorizontalSpriteCount > 1) {

					// "go right" is applicable - TODO write logic here

					if (c_SpriteIndex > p_Self.options._imageHorizontalSpriteCount) {

						// spriteIndex exceed the image's horizontal sprite(s) count.
						// proceed to next row by incrementing vertical index.

					} else {}

				} else {

					// "go right" is not available, so check if "go down" applicable

					if (p_Self.options._imageVerticalSpriteCount > 1) {

						// "go down" is applicable

						p_Self.options._spriteHorizontalIndex = 0;
						p_Self.options._spriteVerticalIndex = parseInt(c_SpriteIndex, 10);

					} else {

						// "go down" is not available

						console.log(PLUGIN_NAME + ".js | Warning | ID=" + p_Self.options._cssSelector + " | There is one sprite exist but spriteIndex is greater than 0.");

						return {horizontal: 0, vertical: 0};

					}

				}

			}

			return {horizontal: p_Self.options._spriteHorizontalIndex, vertical: p_Self.options._spriteVerticalIndex};

		};

		$.fn[PLUGIN_NAME].gatherDimensionalIndexes = function(p_Self, p_CalculateAnyway) {

			// NOTE This function has to be called by loadImage(), after image has been loaded.
			//      For once.
			//
			// New function for dimensional index gathering

			if (typeof(p_CalculateAnyway) === "undefined")
				p_CalculateAnyway = false;

			if (!p_CalculateAnyway)
				if (p_Self.options._spriteHorizontalIndex > -1 && p_Self.options._spriteVerticalIndex > -1)
					return {horizontal: p_Self.options._spriteHorizontalIndex, vertical: p_Self.options._spriteVerticalIndex};

			var c_ImageDimension = p_Self.options.imageDimension;

			if (c_ImageDimension === undefined || c_ImageDimension.width === -1 || c_ImageDimension.height === -1) {

				console.log(PLUGIN_NAME + ".js | Warning | ID=" + p_Self.options._cssSelector + " | Due to image has NOT been loaded yet, image dimension can NOT used to gather indexes. Exiting from gatherDimensionalIndexes().");

				return {horizontal: 0, vertical: 0};

			}

			var c_SpriteDimension = p_Self.options.spriteDimension;
			var c_ViewportDimension = {width: p_Self.element.offsetWidth, height: p_Self.element.offsetHeight};
			// var c_ViewportDimension = p_Self.options.viewportDimension;

			if (c_SpriteDimension.width === -1 || c_SpriteDimension.height === -1) {

				console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | Sprite dimensions must be set in order to use spriteIndex property.");

				return {horizontal: 0, vertical: 0};

			}

			if (p_Self.options._imageVerticalSpriteCount === -1 || p_Self.options._imageHorizontalSpriteCount === -1) {

				p_Self.options._imageHorizontalSpriteCount = (c_ImageDimension.width / c_SpriteDimension.width);
				p_Self.options._imageVerticalSpriteCount = (c_ImageDimension.height / c_SpriteDimension.height);

			}

			var c_SpritesCount = p_Self.options._imageHorizontalSpriteCount * p_Self.options._imageVerticalSpriteCount;
			var c_SpriteIndex = parseInt(p_Self.options.spriteIndex, 10);

			if (c_SpriteIndex === NaN) {

				console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | c_SpriteIndex can NOT be equal or greater than sprites count.");

				return {horizontal: 0, vertical: 0};

			}

			if (c_SpriteIndex >= c_SpritesCount) {

				console.log(PLUGIN_NAME + ".js | Error | ID=" + p_Self.options._cssSelector + " | c_SpriteIndex can NOT be equal or greater than sprites count.");

				return {horizontal: 0, vertical: 0};

			}

			p_Self.options._spriteVerticalIndex = parseInt(c_SpriteIndex / p_Self.options._imageHorizontalSpriteCount, 10);
			p_Self.options._spriteHorizontalIndex = (c_SpriteIndex - (p_Self.options._spriteVerticalIndex * p_Self.options._imageHorizontalSpriteCount));

			if (p_Self.options.verbose)
				console.log(PLUGIN_NAME + ".js | ID=" + p_Self.options._cssSelector + " | Dimensional index is " + p_Self.options._spriteHorizontalIndex + "x" + p_Self.options._spriteVerticalIndex);

			return {horizontal: p_Self.options._spriteHorizontalIndex, vertical: p_Self.options._spriteVerticalIndex};

		};

	}) (jQuery, window, document);

/* Methods */

	var m_LazylouResizeTimeout;

	function _lazylouResizeEnd() {

		if ($.fn.lazylou.defaults.verbose)
			console.log("lazylou.js | Resize end.");

		var c_Element = null;

		$("[data-lazylou-id]").each(function(p_Index, p_Element) {

			c_Element = $(p_Element);

			if (c_Element.data("lazylou").options.spriteIndex === 0)
				return;

			$(c_Element).css(
				"background-position",
				$.fn.lazylou.calculateBackgroundPosition(c_Element.data("lazylou"), "px", true)
			);

		});

	}

	$(window).resize(function() {

		clearTimeout(m_LazylouResizeTimeout);

		m_LazylouResizeTimeout = setTimeout(function() {

			_lazylouResizeEnd();

		}, 200);

	});