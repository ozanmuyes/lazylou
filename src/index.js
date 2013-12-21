$(function() {

	// $.fn.lazylou.defaults.verbose = false;

	$("article#horizontal div.image").lazylou({

		src: "img/6x1.jpg",
		spriteDimension: {width: 100, height: 100},
		spriteIndex: "%I"

	});

	$("article#vertical div.image").lazylou({

		src: "img/1x5.jpg",
		spriteDimension: {width: 100, height: 100},
		spriteIndex: "%I"

	});

	var m_Multi = $("article#multi div.image").lazylou({

		src: "img/7x6.jpg",
		spriteDimension: {width: 100, height: 100},
		spriteIndex: "%I"

	});

	return;

});