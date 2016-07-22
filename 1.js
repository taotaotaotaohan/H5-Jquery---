/**
* jQuery plugin "Swipe slider".
* Image slider that supports swiping function to change slides.
*/
(function ($) {
  self=this;
  self.data;//用于存放url请求过来的数据
  $.fn.swipeslider = function (options) {
    var slideContainer = this;
    var slider = this.find('.sw-slides'); // reference to slider
    var defaultSettings = {
      data1:0,
      /**
      / How long one slide will change the other.
      */
      transitionDuration: 500,
      /**
      / Enable autoplay
      */
      autoPlay: 1,
      /**
      * How frequently slides will be changed.
      */
      autoPlayTimeout: 5000,
      /**
      * Transition effect.
      */
      timingFunction: 'ease-out',
      /**
      * Show 'Next' and 'Previous' buttons.
      */
      prevNextButtons: true,
      /**
      * Show slide switches.
      */
      bullets: true,
      /**
      * Enable swipe function.
      */
      swipe: true,
      /**
      * Overall height of the slider. Set it to percent to make it responsive.
      * Otherwise the slider will keep the height.
      */
      sliderHeight: '60%'
    };
    var settings = $.extend(defaultSettings, options);

    // Privates //
    /** Sliding states:
    * 0 - sliding not started
    * 1 - sliding started
    * 2 - slide released
    */
    var slidingState = 0;
    var startClientX = 0;
    var startPixelOffset = 0;
    var pixelOffset = 0;
    var currentSlide = 1;
    var slideCount = 0;
    // Overall width of sliders.
    var slidesWidth = 0;
    // Flag for disbling swipe function while transition animation is playing.
    var allowSwipe = true;
    var transitionDuration = settings.transitionDuration;
    var swipe = settings.swipe;
    var autoPlayTimeout = settings.autoPlayTimeout;
    // ID of timeout function that waits for animation to end.
    var animationDelayID = undefined;
    var allowSlideSwitch = true;
    var autoPlay = settings.autoPlay;
    /** 
    * Set initial values.
    */
    playaudio();//第一页的audio
    (function init() {
      $(slideContainer).css('padding-top', settings.sliderHeight);
      
      slidesWidth = slider.width();
        
      // Change slide width when window changes.
      $(window).resize(resizeSlider);
          
      if(settings.prevNextButtons) {
        insertPrevNextButtons();
      }
      
      // Add last slide before first and first before last to seamless and engless transition
      slider.find('.sw-slide:last-child').clone().prependTo(slider);
      slider.find('.sw-slide:nth-child(2)').clone().appendTo(slider);
      slideCount = slider.find('.sw-slide').length;
      if(settings.bullets) {
        insertBullets(slideCount - 2);
      }

      setTransitionDuration(transitionDuration);
      setTimingFunction(settings.timingFunction);
      setTransitionProperty('all');
      
      if(swipe) {
        // Add event handlers to react when user swipe.
        slider.on('mousedown touchstart', swipeStart);
        $('html').on('mouseup touchend', swipeEnd);
        $('html').on('mousemove touchmove', swiping);
      }

      // Jump to slide 1 (since another slide was added to the beginning of row);
      jumpToSlide(1);

      enableAutoPlay();
    })();
    
    /**
    * Changes slider size to response on window change.
    */
    function resizeSlider(){
      // Slide width is being changed automatically. Tough slidesWidth used to calculate a distance of transition effect.
      slidesWidth = slider.width();
      switchSlide();
    }

    /**
    * Triggers when user starts swipe.
    * @param event browser event object
    */
    function swipeStart(event) {
      if(!allowSwipe) {
        return;
      }

      disableAutoPlay();
      // If it is mobile device redefine event to first touch point
      if (event.originalEvent.touches)
        event = event.originalEvent.touches[0];

      // Check if slide started on slider 
      if (slidingState == 0){
        slidingState = 1; // Status 1 = slide started.
        startClientX = event.clientX;
      }
    }

    /** Triggers when user continues swipe.
    * @param event browser event object
    */
    function swiping(event) {
      var pointerData;
      
      // Get pointer data from event.
      if (event.originalEvent.touches) {
        pointerData = event.originalEvent.touches[0];
      } else {
        pointerData = event;
      }

      // Distance of slide from the first touch
      var deltaSlide = pointerData.clientX - startClientX;

      // If sliding started first time and there was a distance.
      if (slidingState == 1 && deltaSlide != 0) {
        slidingState = 2; // Set status to 'actually moving'
        startPixelOffset = currentSlide * -slidesWidth; // Store current offset of slide
      }

      //  When user move image
      if (slidingState == 2) {
        event.preventDefault(); // Disable default action to prevent unwanted selection. Can't prevent touches.
        
        // Means that user slide 1 pixel for every 1 pixel of mouse movement.
        var touchPixelRatio = 1;
        // Check for user doesn't slide out of boundaries
        if ((currentSlide == 0 && pointerData.clientX > startClientX) ||
           (currentSlide == slideCount - 1 && pointerData.clientX < startClientX)) {
          // Set ratio to 3 means image will be moving by 3 pixels each time user moves it's pointer by 1 pixel. (Rubber-band effect)
          touchPixelRatio = 3;
        }

        // How far to translate slide while dragging.
        pixelOffset = startPixelOffset + deltaSlide / touchPixelRatio;
        enableTransition(false);
        // Apply moving and remove animation class
        translateX(pixelOffset);
      }
    }

    /** Triggers when user finishes swipe.
    * @param event browser event object
    */
    function swipeEnd(event) {
      if (slidingState == 2) {
        // Reset sliding state.
        slidingState = 0;
        // Calculate which slide need to be in view.
        currentSlide = pixelOffset < startPixelOffset ? currentSlide + 1 : currentSlide -1;
        // Make sure that unexisting slides weren't selected.
        currentSlide = Math.min(Math.max(currentSlide, 0), slideCount - 1);
        // Since in this example slide is full viewport width offset can be calculated according to it.
        pixelOffset = currentSlide * -slidesWidth;
        playaudio()
        disableSwipe();
        switchSlide();
        enableAutoPlay();
      }
      
      slidingState = 0;

    } 

    /** 
    * Disables reaction on swipe while transition effect is playing.
    */
    function disableSwipe() {
      allowSwipe = false;
      window.setTimeout(enableSwipe, transitionDuration)
    }

    /** 
    * Enables reaction on swipe.
    */
    function enableSwipe() {
      allowSwipe = true;
    }

    /**
    * Disables autoplay function.
    * Used while performing manual operations.
    */
    function disableAutoPlay() {
      allowSlideSwitch = false;
      window.clearTimeout(animationDelayID);
    }
    
    /**
    * Enables autoplay function.
    * Used to prevent auto play when user performs manual switching.
    */
    function enableAutoPlay() {
      if(autoPlay) {
        allowSlideSwitch = true;
        startAutoPlay();
      }
    }

    /**
    * Launches autoPlay function with delay.
    */
    function startAutoPlay() {
      if(allowSlideSwitch) {
        animationDelayID = window.setTimeout(performAutoPlay, autoPlayTimeout);
      }
    }

    /**
    * Switches between slides in autoplay mode.
    */
    function performAutoPlay() {
      switchForward();
      startAutoPlay();
    }

    /**
    * Switches slideshow one slide forward.
    */
    function switchForward() {
      currentSlide += 1;
      playaudio();
      switchSlide();
    }
    /**
    * Switches slideshow one slide backward.
    */
    function switchBackward() {
      currentSlide -= 1;
      playaudio();
      switchSlide();
    }
    
    /**
    * Switches slideshow to currentSlide.
    */
    function switchSlide() {
      enableTransition(true);
      translateX(-currentSlide * slidesWidth);
      
      if(currentSlide == 0) {
        window.setTimeout(jumpToEnd, transitionDuration);
      } else if (currentSlide == slideCount - 1) {
        window.setTimeout(jumpToStart, transitionDuration);
      }
      setActiveBullet(currentSlide);
    }
    /**
     *输入当前的currentslide，按照顺序插入当强页面应有的audio
     */
    function playaudio(){
      var bug=currentSlide-1;//修复原有bug，currentslide不能从0开始，不然会跃变至1导致错位
      bug=Math.min(bug,slideCount-3);
      bug=Math.max(bug,0);
      if(currentSlide==slideCount-1){
        console.log("here");
        bug=0;
      }
      console.log("页数",bug,"currentSlide",currentSlide);
      if(typeof(self.data.data.pagelist[bug].audiolist)!="undefined"){
        for(var i=0;i<self.data.data.pagelist[bug].audiolist.length;i++){
          $('body').children('audio').remove();//删除之前已经放过的音频
          $('body').append("<audio id=\"audio"+bug+i+"\" src=\""+self.data.data.pagelist[bug].audiolist[i].audio_url+"\" width=\"0\" height=\"0\"></audio>");
          console.log(self.data.data.pagelist[bug].audiolist[i].audio_url,self.data.data.pagelist[bug].page_id);
          if(i>0){
            var s="$(\"#audio"+bug+i+"\")[0].play();";
            setTimeout(s,self.data.data.pagelist[bug].audiolist[i-1].audio_length*1000+2000);
          }else{
            setTimeout("$(\"#audio"+bug+""+i+"\")[0].play();",2000);
            //$("#audio"+bug+""+i)[0].play();
            autoPlayTimeout=self.data.data.pagelist[bug].audiolist[i].audio_length*1000+5000;
          }
        }
      }
      console.log(autoPlayTimeout,bug);
    }
    /**
    * Switches slideshow to the first slide.
    * Remark: the first slide from html elements, not the slide that was added for smooth transition effect.
    */
    function jumpToStart() {
      jumpToSlide(1);
    }
    
    /**
    * Switches slideshow to the last slide.
    * Remark: the last slide from html elements, not the slide that was added for smooth transition effect.
    */
    function jumpToEnd() {
      jumpToSlide(slideCount - 2);
    }

    /**
    * Switches slideshow to exact slide number.
    * Remark: respecting two slides that were added for smooth transaction effect.
    */
    function jumpToSlide(slideNumber) {
      enableTransition(false);
      currentSlide = slideNumber;
      translateX(-slidesWidth * currentSlide);
      window.setTimeout(returnTransitionAfterJump, 50);
    }

    /**
    * Returns transition effect after jumpToSlide function call.
    */
    function returnTransitionAfterJump() {
      enableTransition(true);
    }

    /** 
    * Enables or disables transition
    * @param {bool} true to enable traintion.
    */
    function enableTransition(enable) {
      if (enable) {
        setTransitionProperty('all');
      } else {
        setTransitionProperty('none');
      }
    }

    /**
    * Translates slides on certain amount.
    * @param distance {Number} distance of transition. If negative, transition from right to left.
    */
    function translateX(distance) {
      slider
      // Prefixes are being set automatically.
  //      .css('-webkit-transform','translateX(' + distance + 'px)')
  //      .css('-ms-transform','translateX(' + distance + 'px)')
        .css('transform','translateX(' + distance + 'px)');
    }

    /**
    * Sets duration of transition between slides.
    * @param duration {Number} amount in milliseconds.
    */
    function setTransitionDuration(duration) {
      slider
  //      .css('-webkit-transition-duration', duration + 'ms')
        .css('transition-duration', duration + 'ms');
    }

    /**
    * Sets transition function.
    */
    function setTimingFunction(functionDescription) {
      slider
  //      .css('-webkit-transition-timing-function', functionDescription)
        .css('transition-timing-function', functionDescription);
    }

    /**
    * Sets property that will be used in transition effect.
    */
    function setTransitionProperty(property) {
      slider
  //      .css('-webkit-transition-property', property)
        .css('transition-property', property);
    }
    
    /**
    * Next slide and Previous slide buttons.
    */
    function insertPrevNextButtons() {
      slider.after('<span class="sw-next-prev sw-prev"></span>');
      slideContainer.find('.sw-prev').click(function(){
        if(allowSlideSwitch){
          disableAutoPlay();
          switchBackward();
          enableAutoPlay();
        }
      });
      slider.after('<span class="sw-next-prev sw-next"></span>');
      slideContainer.find('.sw-next').click(function(){
        if(allowSlideSwitch) {
          disableAutoPlay();
          switchForward();
          enableAutoPlay();
        }
        });
    }
    
    /**
    * Add bullet indicator of current slide.
    */
    function insertBullets(count) {
      slider.after('<ul class="sw-bullet"></ul>');
      var bulletList = slider.parent().find('.sw-bullet');
      for (var i = 0; i < count; i++) {
       
        if (i == 0) {
          bulletList.append('<li class="sw-slide-' + i + ' active"></li>');
        } else {
          bulletList.append('<li class="sw-slide-' + i + '"></li>');
        }
        
        var item = slideContainer.find('.sw-slide-' + i);
        
        // Workaround a problem when iterator i will have max value due to closure nature.
        (function(lockedIndex) {
          item.click(function() {
            // Disable autoplay on time of transition.
            disableAutoPlay();
            currentSlide = lockedIndex + 1;
            switchSlide();
            enableAutoPlay();
          });
        })(i);
      }
    }
    /**
    * Sets active bullet mark of active slide.
    * @param number {Number} active slide with respect of two added slides. 
    */
    function setActiveBullet(number) {
      var activeBullet = 0;
      
      if(number == 0) {
        activeBullet = slideCount - 3;
      } else if (number == slideCount - 1) {
        activeBullet = 0;
      } else {
        activeBullet = number - 1;
      }
      slideContainer.find('.sw-bullet').find('li').removeClass('active');
      slideContainer.find('.sw-slide-' + activeBullet).addClass('active');
    }

    return slideContainer;    
  }

  /**
   * 根据请求的数据，动态创建页面
   */
  $.fn.initPage=function(){
    console.log(self.data);
    if(self.data.data.pagelist.length){
      for(var i=0;i<self.data.data.pagelist.length;i++) {
        $('.sw-slides').append("<li class=\"sw-slide\" id=\"ii\"> <img src=\"" + self.data.data.pagelist[i].image_url + "\" > </li>");
      }
    }
    var num=$('img').length;
    $('img').load(function(){
      num-=1;
      if(num==0){
        $('#full_feature').swipeslider();
      }
    });
  }

}(jQuery));