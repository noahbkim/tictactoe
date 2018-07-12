
const X = "X";
const O = "O";

const SYMBOL = {"X": "&#x2573;", "O": "&#x25EF;", "": ""};
const POSSIBLE = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];


class Mouse {

  constructor() {
    this.callback = null;
  }

  click(index) {
    if (this.callback)
      this.callback(index);
    this.callback = null;
  }

  wait(callback) {
    this.callback = callback;
  }

}


/* Create one mouse for everyone to use. */
window.mouse = new Mouse();


class Cell {

  constructor(element, index) {
    this.element = element;
    this.letter = '';
    this.element.addEventListener("click", () => mouse.click(index));
  }

  set(letter) {
    this.letter = letter;
    this.element.innerHTML = SYMBOL[letter];
    if (letter === O) this.element.classList.add("o");
    else this.element.classList.remove("o");
  }

}


class Board {

  constructor(cells) {
    this.cells = cells;
  }

  static setup() {
    let element = document.getElementById("board");
    let cells = [];
    let index = 0;
    for (let td of element.getElementsByTagName("td"))
      cells.push(new Cell(td, index++));
    return new Board(cells);
  }

  set(index, letter) {
    this.cells[index].set(letter);
  }

  matrix() {
    const l = this.cells.map(cell => cell.letter);
    return [[l[0], l[1], l[2]], [l[3], l[4], l[5]], l[6], l[7], l[8]];
  }

  win(move) {
    const letter = this.cells[move].letter;
    for (let possible of POSSIBLE)  // Check all win configurations
      if (possible.indexOf(move) > -1)  // Check if the move just made is in that configuration
        if (possible.map(index => (this.cells[index].letter === letter)).reduce((a, b) => a && b))  // Check if all letters are equal to our letter
          return true;
    return false;
  }

  clear() {
    for (let cell of this.cells)
      cell.set("");
  }

}


class Player {

  constructor(name, letter) {
    this.name = name;
    this.letter = letter;
  }

  static get description() { return "abstract player" }

  /** Return a Promise with a move number given a 2D array board. */
  turn(board) {}

}


/* Create a registry of player types that can be added to. */
Player.types = [];


class HumanPlayer extends Player {

  static get description() { return "human player" }

  turn() {
    return new Promise((resolve) => {
      mouse.wait(resolve)
    });
  }

}

Player.types.push(HumanPlayer);



class Game {

  constructor() {
    this.board = Board.setup();
    this.players = [null, null];  // Trick for toggling turns
    this.turn = 0;
    this.elements = {};
    this.bind();
  }

  // Populate the user interface
  bind() {

    // Find elements
    this.elements.menu = document.getElementById("menu");
    this.elements.start = document.getElementById("start");
    this.elements.dashboard = document.getElementById("dashboard");
    this.elements.turn = document.getElementById("turn");
    this.elements.reset = document.getElementById("reset");

    // Fill in player types dynamically
    for (const select of document.getElementsByClassName("players"))
      for (let i = 0; i < Player.types.length; i++)
        select.innerHTML += "<option value=" + i + ">" + Player.types[i].description + "</option>"

    // Set callback for starting game
    this.elements.start.addEventListener("click", () => this.start());
    this.elements.reset.addEventListener("click", () => this.reset());

  }

  start() {
    const type1 = Player.types[document.forms.players.player1.value];
    const type2 = Player.types[document.forms.players.player2.value];
    let name1 = type1.description;
    let name2 = type2.description;
    if (type1 === type2) { name1 += " 1"; name2 += " 2"; }
    this.players = [new type1(name1, X), new type2(name2, O)];
    this.elements.menu.classList.add("hidden");
    this.elements.dashboard.classList.remove("hidden");
    this.play();
  }

  play() {
    const player = this.players[this.turn++ % 2];
    this.elements.turn.innerHTML = player.name + "'s turn";
    player.turn(this.board.matrix()).then(move => {
      this.board.set(move, player.letter);
      if (this.board.win(move))
        this.won(player);
      else this.play();
    });
  }

  won(player) {
    this.turn = 0;
    this.elements.reset.classList.remove("hidden");
    this.elements.turn.innerHTML = player.name + " wins!";
  }

  reset() {
    this.board.clear();
    this.elements.reset.classList.add("hidden");
    this.elements.dashboard.classList.add("hidden");
    this.elements.menu.classList.remove("hidden");
  }

}



window.onload = () => {
  window.game = new Game();
};
