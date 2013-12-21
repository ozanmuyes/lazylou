![Lou](https://raw.github.com/ozanmuyes/lazylou/master/img/lou.png)

Meet Lou, a.k.a. **Lazy Lou**. The guy sits on the couch all the time after load your images.  
That's it. There's no more story to tell about Lou. He is very self-explanatory.

- - -

#1. Waking up Lou
You can call Lou to load your images a few different ways, and also combining them with each other. For example you can set some of properties (let's say `src`) by HTML and some of other properties (let's say `spriteDimension`) by jQuery. This is useful when using PHP, so you don't need to set `src` property of individual image by jQuery.  
It's OK, but what if you set same properties by HTML and also jQuery? Lou loves HTML than jQuery, hence **the properties set by HTML overrides the properties set by jQuery**.

#2. Properties

|Name|Type|Default|Explanation|Optional|
|:---|:---|:------|:----------|:------:|
|`autoAdjustElementSize`|bool|true|If element's size is 0x0 (so not assigned by CSS nor jQuery/javascript) this function will be referred to whether try to gather `spriteDimension` if set, or to show some error.|Yes|
|`autoAdjustSpriteSize`|bool|true|In case of unable-to-gather `spriteDimension` from options, if element's size is set, assign it to the `spriteDimension`.|Yes|
|`autoStart`|bool|true|Indicates image should load right after initialization Or vice-versa.|Yes|
|`cleanUp`|bool|true|If set to `true`, all LazyLou-related HTML data will be removed from DOM.|Yes|
|`name`|string|null|The variable to hold image name to use multiple elements registered for that name.|Yes|
|`src`|string|null|The path of image. Should be set in order to load image.|**No**|
|`spriteDimension`|int\*int|-1*-1|Sprite size (width\*height) as **px**.|Yes (if `spriteIndex` not set)/**No** (if `spriteIndex` set)|
|`spriteIndex`|int|-1|The sprite index based on upper left corner of image. If not set the first sprite on the image will be shown.|Yes|
|`verbose`|bool|false|Indicates whether all debug informations will be logged or not.|Yes|

As you've been told, these properties are can be set either HTML data and jQuery. For demonstration of codes please refer [Examples 4.1][41].

#3. Callbacks

|Name|Parameters|Explanation|
|:---|:---------|:----------|
|onInitialized|null|Called after initialization of particular element.|
|onFinished|null|Called after image is loaded.|

#4. Examples

##4.1 Loading Images with Minimum Effort

+ jQuery does all the job. HTML and jQuery codes respectively;
`<div class="lazylou"></div>`
`$("div.lazylou").lazylou({src: "img/1x5.jpg"});`

+ HTML is involved to set property. HTML and jQuery codes respectively;
`<div class="lazylou" data-lazylou-options='{"src": "img/1x5.jpg"}'></div>`
`$("div.lazylou").lazylou();`

+ HTML is involved to set property. HTML and jQuery codes respectively;
`<div class="lazylou" data-lazylou-options-src="img/1x5.jpg"></div>`
`$("div.lazylou").lazylou();`

These two examples are doing the same thing; load the image and show first sprite.

**REMARKS**: Notice the single-quote and double-quote sequence. **Single-quote should start the string of data value.**

#5. Dependencies

jQuery is enough to use LazyLou.

#6. License 
This plugin licensed under [MIT License][MITL]. Short of long, feel free to use, modify, distribute and fork. 

- - -

Images from [http://ballicons.net](http://ballicons.net)

[MITL]: http://opensource.org/licenses/MIT
[41]: https://github.com/ozanmuyes/lazylou#41-loading-images-with-minimum-effort
