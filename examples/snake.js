// The main logic for your project goes in this file.

/**
 * The Player object; an Actor controlled by user input.
 */
var player;

/**
 * Keys used for various directions.
 */
var keys = {
  up: ['up', 'w'],
  down: ['down', 's'],
  left: ['left', 'a'],
  right: ['right', 'd'],
};

/**
 * An array of image file paths to pre-load.
 */
var preloadables = [
                    ];

/**
 * Layers.
 */
var hud;

/**
 * Food for the snake.
 */
var dots;

/**
 * Parts of the snake.
 */
var pieces;

/**
 * Score counter.
 */
var score = 0;

/**
 * The size of each piece, dot, and movement step.
 */
var UNIT = 20;

/**
 * Snake-food.
 */
var Dot = Box.extend({
  // Draw dots as smiley faces
  drawDefault: Actor.prototype.drawDefault,
  // Convenient function to get a random value on the unit grid
  getRand: function(bound) {
    var x = App.Utils.getRandIntBetween(0, bound-UNIT);
    return x-x%UNIT;
  },
  // Return whether the dot overlaps any pieces of the snake
  overlapsPieces: function() {
    for (var i = pieces.items.length-1; i >= 0; i--) {
      if (this.overlaps(pieces.items[i])) {
        return true;
      }
    }
    return false;
  },
  // Check whether a Box is within some distance of this dot
  near: function(otherBox, units) {
    return this.nearX(otherBox, units) && this.nearY(otherBox, units);
  },
  nearX: function(otherBox, units) {
    return this.x + this.width + units > otherBox.x && otherBox.x + otherBox.width + units > this.x;
  },
  nearY: function(otherBox, units) {
    return this.y + this.height + units > otherBox.y && otherBox.y + otherBox.height + units > this.y;
  },
  // Initialize the Dot in a random location that doesn't overlap the snake
  init: function() {
    do {
      var x = this.getRand(world.width);
      var y = this.getRand(world.height);
    } while (this.near(player, UNIT*5) || this.overlapsPieces());
    this._super.call(this, x, y, UNIT, UNIT);
  },
});

/**
 * A magic-named function where all updates should occur.
 *
 * @param {Number} delta
 *   The amount of time since the last update. Use this to smooth movement.
 *   This has the same value as the global App.physicsDelta.
 * @param {Number} timeElapsed
 *   The amount of time elapsed while animating. This is useful for time-based
 *   movement and limiting the frequency of events. This has the same value as
 *   the global App.physicsTimeElapsed.
 */
function update(delta, timeElapsed) {
  player.update();
  // Game over if the player hits the edge of the world or gets the max score
  if (!world.isInWorld(player) || score >= ((world.width/UNIT)|0)*((world.height/UNIT)|0)) {
    App.gameOver();
    score = 0;
  }

  // Game over if the player hits itself
  pieces.forEach(function(piece) {
    if (player.collides(piece)) {
      App.gameOver();
      score = 0;
    }
  });

  // Collect the dots and update the score
  dots.forEach(function(dot) {
    if (player.collides(dot)) {
      dots.add(new Dot());
      player.addedDot = true;
      score++;
      hud.context.clear();
      hud.context.strokeText('Score: ' + score, canvas.width - 15*((score+'').length), 15);
      hud.context.fillText('Score: ' + score, canvas.width - 15*((score+'').length), 15);
      return true;
    }
  });
}

/**
 * A magic-named function where all drawing should occur.
 */
function draw() {
  dots.draw();
  pieces.draw();
  player.draw();
  hud.draw();
}

/**
 * A magic-named function for one-time setup.
 *
 * @param {Boolean} first
 *   true if the app is being set up for the first time; false if the app has
 *   been reset and is starting over.
 */
function setup(first) {
  // Switch from top-down to side view.
  Actor.prototype.GRAVITY = false;

  // Initialize the player.
  var x = (world.width/2-5)|0, y = (world.height/2-5)|0;
  x = x-x%UNIT;
  y = y-y%UNIT;
  player = new Player(x, y, UNIT, UNIT);
  player.CONTINUOUS_MOVEMENT = true; // Keep going in the last direction
  player.STAY_IN_WORLD = false; // Let the player walk off the edge and die
  player.fillStyle = 'darkGray';
  player.lastMove = App.physicsTimeElapsed;
  Player.prototype.drawDefault = Box.prototype.drawDefault;
  Player.prototype.move = function() {
    if (App.physicsTimeElapsed > player.lastMove + 0.005*UNIT) {
      player.lastMove = App.physicsTimeElapsed;
      // The snake's body should follow the head
      pieces.add(new Box(player.x, player.y, UNIT, UNIT));

      // The section below this is adapted from the normal move() method
      var d2 = App.physicsDelta / 2;
      // Apply half acceleration (first half of midpoint formula)
      this.xVelocity += this.xAcceleration*d2;
      this.yVelocity += this.yAcceleration*d2;
      // Apply thrust (the snake moves specific distances; no smoothing)
      this.x += this.xVelocity.sign()*UNIT;
      this.y += this.yVelocity.sign()*UNIT;
      // Apply half acceleration (second half of midpoint formula)
      this.xVelocity += this.xAcceleration*d2;
      this.yVelocity += this.yAcceleration*d2;

      // Remove the trailing piece unless we're growing
      if (!player.addedDot) {
        pieces.removeFirst();
      }
      player.addedDot = false;
    }
  };

  pieces = new Collection();
  dots = new Collection();
  dots.add(new Dot());

  // Set up the foreground layer.
  hud = new Layer({
    relative: 'canvas',
  });
  hud.context.font = '30px Arial';
  hud.context.textAlign = 'right';
  hud.context.textBaseline = 'top';
  hud.context.fillStyle = 'black';
  hud.context.strokeStyle = 'rgba(211, 211, 211, 0.5)';
  hud.context.lineWidth = 3;
  hud.context.strokeText('Score: 0', canvas.width - 15, 15);
  hud.context.fillText('Score: 0', canvas.width - 15, 15);
}