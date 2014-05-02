(function() {
    "use strict";

    // Board controller
    // keep track of where and what kind of pieces are on board
 
    var square = [];
    var captive = {
	my: [],
	ai: []
    };
        
    var board = {
        
        setPiece: function(x, y, type, mine) {
            if (!square[x]) {
                square[x] = [];
            }
            square[x][y] = {
                type: type,
                mine: mine
            };
        },

        getPiece: function(x, y) {
            if (!square[x]) {
                return null;
            } else {
                return square[x][y] || null;
            }
        },

        removePiece: function(x, y) {
            if (!square[x] || !square[x][y]) {
                return null;
            }
            delete square[x][y];
        },
        
	setAvailable: function(x, y) {
            if (!square[x]) {
                square[x] = [];
            }

	    if (square[x][y]) {
		square[x][y].available = true;
	    } else {
		square[x][y] = {
		    available: true
		};
	    }
	},

	getAvailable: function(x, y) {
            if (!square[x]) {
                return false;
            } else if (!square[x][y]) {
		return false;
	    } else {
		return !!square[x][y].available;
	    }
	},

	resetAvailable: function() {
	    for (var i = 0; i < square.length; i++) {
		for (var j = 0; j < square[i].length; j++) {
		    if (square[i] && square[i][j]) {
			if (square[i][j].type) {
			    // There is a piece on i,j. Set available: false
			    square[i][j].available = false;
			} else {
			    // There is no piece on i,j. Delete.
			    delete square[i][j];
			}
			// XXX works but not good to have meaningless object
			//square[i][j].available = false;
		    }
		}
	    }
	},

	getInhandAvailPos: function(type) {
	    var i, j, k, pos = [];

	    var squareAvailable = function(piece) {
		return (!piece || !piece.type);
	    };

	    var isNihu = function(x) {
		if (type !== 'hu') {
		    return false;
		}
		
		for (k = 0; k < square[x].length; k++) {
		    if (square[x][k] && square[x][k].type === 'hu' && square[x][k].mine === true) {
			return true;
		    }
		}
	    };

	    for (i = 0; i < square.length; i++) {
		for (j = 0; j < square[i].length; j++) {
		    if (squareAvailable(square[i][j]) && !isNihu(i)) {
			pos.push([i, j]);
		    }
		}
	    }
	    
	    return pos;
	},

	addCaptive: function(type, mine) {
	    var id = mine ? 'my' : 'ai';
	    captive[id].push(type);	    
	},

	// Send the whole board info at once (no need to save state in server)
	upload: function(success) {
	    var xhr = new XMLHttpRequest();
	    var data = {
		square: square,
		captive: captive
	    };

	    xhr.onload = function() {
		success(JSON.parse(this.responseText));
	    };

	    xhr.open("POST", "ai");
	    xhr.setRequestHeader("Content-Type", "application/json");
	    //xhr.send(JSON.stringify(square));
	    xhr.send(JSON.stringify(data));

	    board.debug();
	},

        debug: function() {
            console.log("SQUARE: " + JSON.stringify(square));
            console.log("CAPTIVE: " + JSON.stringify(captive));
        }
    };
    
    this.board = board;
    
}).call(this);
