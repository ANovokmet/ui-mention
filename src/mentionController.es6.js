angular.module('ui.mention')
.controller('uiMention', function (
  $element, $scope, $attrs, $q, $timeout, $document
) {

  // Beginning of input or preceeded by spaces: @sometext
  this.delimiter = '@';

  // this.pattern is left for backward compatibility
  this.searchPattern = this.pattern || new RegExp("(?:\\s+|^)" + this.delimiter + "(\\w+(?: \\w+)?)$");

  this.decodePattern = new RegExp(this.delimiter + "\[[\\s\\w]+:[0-9a-z-]+\]", "gi");

  
  this.currentConfig = undefined;

  this.config = this.config && this.config.map((config) => getDefaultConfig(config)) || [getDefaultConfig()]
  this.setConfig = function(configs) {
    this.config = configs && configs.map((config) => getDefaultConfig(config)) || [getDefaultConfig()]

    
    for(var i = 0; i < this.config.length; i++) {
      let config = this.config[i];

      ngModel.$parsers.push( value => {
        // Removes any mentions that aren't used
        config.mentions = config.mentions.filter( mention => {
          if (~value.indexOf(config.label(mention))){
            return value = value.replace(config.label(mention), config.encode(mention));
          }
        });
  
        this.render(value);
  
        return value;
      });
  
      ngModel.$formatters.push( (value = '') => {
        // In case the value is a different primitive
        value = value.toString();
  
        // Removes any mentions that aren't used
        config.mentions = config.mentions.filter( mention => {
          if (~value.indexOf(config.encode(mention))) {
            value = value.replace(config.encode(mention), config.label(mention));
            return true;
          } else {
            return false;
          }
        });
  
        return value;
      });
    }
  }

  function getDefaultConfig(config) {
    config = config || {};

    let delimiter = config.delimiter || '@';
    let label = config.label || function(choice) {
      return `${choice.first} ${choice.last}`;
    }


    return {
      delimiter: delimiter,
      searchPattern: config.searchPattern || new RegExp("(?:\\s+|^)" + delimiter + "(\\w+(?: \\w+)?)$"),
      decodePattern: config.decodePattern || new RegExp(delimiter + "\[[\\s\\w]+:[0-9a-z-]+\]", "gi"),
      label: label,
      findChoices: config.findChoices || function (match, mentions) {
        return [];
      },
      encode: config.encode || function(choice) {
        return `${delimiter}[${label(choice)}:${choice.id}]`;
      },
      mentions: [],
      highlight: config.highlight || function(choice) {
        return `<span>${label(choice)}</span>`;
      }
    }
  }
  
  

  this.$element = $element;
  this.choices = [];
  this.mentions = [];
  var ngModel;

  /**
   * $mention.init()
   *
   * Initializes the plugin by setting up the ngModelController properties
   *
   * @param  {ngModelController} model
   */
  this.init = function(model) {
    // Leading whitespace shows up in the textarea but not the preview
    $attrs.ngTrim = 'false';

    ngModel = model;

    
    /*ngModel.$parsers.push( value => {
      // Removes any mentions that aren't used
      this.mentions = this.mentions.filter( mention => {
       if (~value.indexOf(this.currentConfig.label(mention))){

        return value = value.replace(this.currentConfig.label(mention), this.currentConfig.encode(mention));
      }
      });

      this.render(value);

      return value;
    });

    ngModel.$formatters.push( (value = '') => {
      // In case the value is a different primitive
      value = value.toString();

      // Removes any mentions that aren't used
      this.mentions = this.mentions.filter( mention => {
        if (~value.indexOf(this.currentConfig.encode(mention))) {
          value = value.replace(this.currentConfig.encode(mention), this.currentConfig.label(mention));
          return true;
        } else {
          return false;
        }
      });

      return value;
    });*/

    ngModel.$render = () => {
      $element.val(ngModel.$viewValue || '');
      $timeout(this.autogrow, true);
      this.render();
    };
  };

  var temp = document.createElement('span');
  function parseContentAsText(content) {
    try {
      temp.textContent = content;
      return temp.innerHTML;
    } finally {
      temp.textContent = null;
    }
  }

  /**
   * $mention.render()
   *
   * Renders the syntax-encoded version to an HTML element for 'highlighting' effect
   *
   * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
   * @return {string}        HTML string
   */
  this.render = (html = ngModel.$modelValue) => {
    html = (html || '').toString();
    // Convert input to text, to prevent script injection/rich text
    html = parseContentAsText(html);

    /*this.mentions.forEach( mention => {
      html = html.replace(this.currentConfig.encode(mention), this.highlight(mention));
    });*/

    this.config.forEach(config => {
      config.mentions.forEach(mention => {
        var encode = config.encode(mention)
        var highlight = config.highlight(mention)
        html = html.replace(config.encode(mention), config.highlight(mention));
      });
    });

    this.renderElement().html(html);
    return html;
  };

  /**
   * $mention.renderElement()
   *
   * Get syntax-encoded HTML element
   *
   * @return {Element} HTML element
   */
   this.renderElement = () => {
     return $element.next();
   };

  /**
   * $mention.highlight()
   *
   * Returns a choice in HTML highlight formatting
   *
   * @param  {mixed|object} choice The choice to be highlighted
   * @return {string}              HTML highlighted version of the choice
   */
  this.highlight = function(choice) {
    return `<span>${this.currentConfig.label(choice)}</span>`;
  };

  /**
   * $mention.decode()
   *
   * @note NOT CURRENTLY USED
   * @param  {string} [text] syntax encoded string (default: ngModel.$modelValue)
   * @return {string}        plaintext string with encoded labels used
   */
  //use for one way formatting
  this.decode = function(value = ngModel.$modelValue) {
    return value ? value.replace(this.decodePattern, '$1') : '';
  };

  /**
   * $mention.label()
   *
   * Converts a choice object to a human-readable string
   *
   * @param  {mixed|object} choice The choice to be rendered
   * @return {string}              Human-readable string version of choice
   */
  this.label = function(choice) {
    return `${choice.first} ${choice.last}`;
  };

  /**
   * $mention.encode()
   *
   * Converts a choice object to a syntax-encoded string
   *
   * @param  {mixed|object} choice The choice to be encoded
   * @return {string}              Syntax-encoded string version of choice
   */
  this.encode = function(choice) {
    return `${this.currentConfig.delimiter}[${this.currentConfig.label(choice)}:${choice.id}]`;
  };

  /**
   * $mention.replace()
   *
   * Replaces the trigger-text with the mention label
   *
   * @param  {mixed|object} mention  The choice to replace with
   * @param  {regex.exec()} [search] A regex search result for the trigger-text (default: this.searching)
   * @param  {string} [text]         String to perform the replacement on (default: ngModel.$viewValue)
   * @return {string}                Human-readable string
   */
  //dont replace with label, but with encoded value
  this.replace = function(mention, search = this.searching, text = ngModel.$viewValue) {
    // TODO: come up with a better way to detect what to remove
    // TODO: consider alternative to using regex match
    text = text.substr(0, search.index + search[0].indexOf(this.currentConfig.delimiter)) +
            this.currentConfig.label(mention) + ' ' +
            text.substr(search.index + search[0].length);
    return text;
  };

  /**
   * $mention.select()
   *
   * Adds a choice to this.mentions collection and updates the view
   *
   * @param  {mixed|object} [choice] The selected choice (default: activeChoice)
   */
  this.select = function(choice = this.activeChoice) {
    if (!choice) {
      return false;
    }

    // Add the mention
    this.currentConfig.mentions.push(choice);

    // Replace the search with the label
    ngModel.$setViewValue(this.replace(choice));

    // Close choices panel
    this.cancel();

    // Update the textarea
    ngModel.$render();
  };

  /**
   * $mention.up()
   *
   * Moves this.activeChoice up the this.choices collection
   */
  this.up = function() {
    let index = this.choices.indexOf(this.activeChoice);
    if (index > 0) {
      this.activeChoice = this.choices[index - 1];
    } else {
      this.activeChoice = this.choices[this.choices.length - 1];
    }
  };

  /**
   * $mention.down()
   *
   * Moves this.activeChoice down the this.choices collection
   */
  this.down = function() {
    let index = this.choices.indexOf(this.activeChoice);
    if (index < this.choices.length - 1) {
      this.activeChoice = this.choices[index + 1];
    } else {
      this.activeChoice = this.choices[0];
    }
  };

  /**
   * $mention.search()
   *
   * Searches for a list of mention choices and populates
   * $mention.choices and $mention.activeChoice
   *
   * @param  {regex.exec()} match The trigger-text regex match object
   * @todo Try to avoid using a regex match object
   */
  this.search = function(match) {
    this.searching = match;

    return $q.when( this.currentConfig.findChoices(match, this.currentConfig.mentions) )
      .then( choices => {
        this.choices = choices;
        this.activeChoice = choices[0];
        return choices;
      });
  };

  /**
   * $mention.findChoices()
   *
   * @param  {regex.exec()} match    The trigger-text regex match object
   * @todo Try to avoid using a regex match object
   * @todo Make it easier to override this
   * @return {array[choice]|Promise} The list of possible choices
   */
  this.findChoices = function(match, mentions) {
    return [];
  };

  /**
   * $mention.cancel()
   *
   * Clears the choices dropdown info and stops searching
   */
  this.cancel = function() {
    this.choices = [];
    this.searching = null;
  };

  this.autogrow = function() {
    $element[0].style.height = 0; // autoshrink - need accurate scrollHeight
    let style = getComputedStyle($element[0]);
    if (style.boxSizing == 'border-box')
    $element[0].style.height = $element[0].scrollHeight + 'px';
  };

  // Interactions to trigger searching
  $element.on('keyup click focus', event => {
    // If event is fired AFTER activeChoice move is performed
    if (this.moved)
      return this.moved = false;
    // Don't trigger on selection
    if ($element[0].selectionStart != $element[0].selectionEnd)
      return;
    let text = $element.val();
    // text to left of cursor ends with `@sometext`

    let match;
    for(var i = 0; i < this.config.length; i++){
      match = this.config[i].searchPattern.exec(text.substr(0, $element[0].selectionStart));
      if(match){
        this.currentConfig = this.config[i];
        this.search(match);
        break;
      }
    }

    if (!match) {
      this.cancel();
    }

    if (!$scope.$$phase) {
      $scope.$apply();
    }
  });

  $element.on('keydown', event => {
    if (!this.searching)
      return;

    switch (event.keyCode) {
      case 13: // return
        this.select();
        break;
      case 38: // up
        this.up();
        break;
      case 40: // down
        this.down();
        break;
      default:
        // Exit function
        return;
    }

    this.moved = true;
    event.preventDefault();

    if (!$scope.$$phase) {
      $scope.$apply();
    }
  });

  this.onMouseup = (function(event) {
    if (event.target == $element[0])
      return

    $document.off('mouseup', this.onMouseup);

    if (!this.searching)
      return;

    // Let ngClick fire first
    $scope.$evalAsync( () => {
      this.cancel();
    });
  }).bind(this);

  $element.on('focus', event => {
    $document.on('mouseup', this.onMouseup);
  });

  // Autogrow is mandatory beacuse the textarea scrolls away from highlights
  $element.on('input', this.autogrow);

  // Initialize autogrow height
  $timeout(this.autogrow, true);
});
