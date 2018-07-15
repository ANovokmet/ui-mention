angular.module('example', ['ui.mention'])
.run(function($rootScope){
  $rootScope.post = {
    message: 'hi there @k'
  };
})
.directive('mentionExample', function(){
  return {
    require: 'uiMention',
    link: function($scope, $element, $attrs, uiMention) {
      /**
       * $mention.findChoices()
       *
       * @param  {regex.exec()} match    The trigger-text regex match object
       * @todo Try to avoid using a regex match object
       * @return {array[choice]|Promise} The list of possible choices
       */
      uiMention.setConfig(
        [
          {
            findChoices: function(match, mentions) {
              return choices
              // Remove items that are already mentioned
              .filter( choice => !mentions.some( mention => mention.id === choice.id ) )
              // Matches items from search query
              .filter( choice => ~`${choice.first} ${choice.last}`.indexOf(match[1]) );
            }
          },
          {
            delimiter: '#',
            findChoices: function(match, mentions) {
              return hashTags
              .filter( choice => ~`${choice.tag}`.indexOf(match[1]) );
            },
            label: function(item) {
              return item.tag;
            },
            highlight: function(choice) {
              return `<span class="tag">${choice.tag}</span>`;
            }
          }
        ]
      );
    }
  };
});

var hashTags = [
  { tag: 'yolo', id:1 },
  { tag: 'jpndts', id:2 },
  { tag: 'jklol', id:3 }
];

var choices = [
  { first: 'bob', last: 'barker', id:11123 },
  { first: 'kenny', last: 'logins', id:'123ab-123' },
  { first: 'kyle', last: 'corn', id:'123' },
  { first: 'steve', last: 'rodriguez', id:'hi' },
  { first: 'steve', last: 'holt', id:'0-9' },
  { first: 'megan', last: 'burgerpants', id:'ab-' },
];
