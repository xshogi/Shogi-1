/*jslint browser:true, indent:4 */
/*global def, board*/

(function() {
    
    var set; // board area, not including mochigoma
    var selected = null; // currently selected piece as DOM Element

    var rowNames = ['one', 'two', 'three', 'four',
                    'five', 'six', 'seven', 'eight', 'nine'];
    var columnNames = ['ichi', 'ni', 'san', 'yon', 
                       'go', 'roku', 'nana', 'hachi', 'kyu'];

    // Num: indexed from 0, Class: indexed from 'one' or 'ichi'
    var convertPosNumToClass = function(row, column) {
        if (rowNames[row] && columnNames[column]) {
            return rowNames[row] + ' ' + columnNames[column];
        } else {
            return false;
        }
    };

    var convertPosClassToNum = function(posClass) {
        var posClassArr, rowName, columnName, rowNum, columnNum;
        
        posClassArr = posClass.split(' ');
        rowName = posClassArr[0];
        columnName = posClassArr[1];
        rowNum = rowNames.indexOf(rowName);
        columnNum = columnNames.indexOf(columnName);
        
        return [rowNum, columnNum];
    };

    var getPosClassFromCoordinate = function(event) {
        var x, y, row, column;
        
        x = event.offsetX;
        y = event.offsetY;
        row = Math.floor(x / 60);
        column = Math.floor(y / 60);
        return convertPosNumToClass(row, column);
    };

    var getPosClassFromElement = function(element) {
        var classes, rowHit, columnHit;
        
        classes = element.className.split(' ');
        for (var i = 0; i < classes.length; i++) {
            if (rowNames.indexOf(classes[i]) > -1) {
                rowHit = rowNames[rowNames.indexOf(classes[i])];
            }
            if (columnNames.indexOf(classes[i]) > -1 ) {
                columnHit = columnNames[columnNames.indexOf(classes[i])];
            }
        }
        
        return rowHit + ' ' + columnHit;
    };

    var markAvailable = function() {
        var type, move, posClass, posNum;
        
	var nextVal = function(val) {
	    if (val < 0) {
	    	return val - 1;
	    } else if (val === 0) {
	    	return val;
	    } else {
	    	return val + 1;
	    }
	}

        var checkMoveAndMark = function(moveX, moveY, continuous) {
            var avail = [], currentPiece, availClass, div, newX, newY;
            
            avail[0] = posNum[0] + moveX;
            avail[1] = posNum[1] + moveY;
            
            currentPiece = board.getPiece(avail[0], avail[1]);
            
            console.log('x: ', avail[0]);
            console.log('y: ', avail[1]);
            console.log('continue: ', continuous);
            console.log('piece: ', currentPiece);
            
            availClass = convertPosNumToClass(avail[0], avail[1]);
            
            if (availClass && (!currentPiece || !currentPiece.mine)) {
                div = document.createElement('div');
                div.setAttribute('class', 'available ' + availClass);
                set.appendChild(div);

		if (currentPiece && !currentPiece.mine) {
			continuous = false;
		}
	    } else {
		continuous = false;
	    }

	    if (continuous) {
		checkMoveAndMark(nextVal(moveX), nextVal(moveY), continuous);
	    }
        };
        
        type = selected.getAttribute('data-piece');
        move = def.piece[type].move;
        posClass = getPosClassFromElement(selected);
        posNum = convertPosClassToNum(posClass);
        
        for (var i = 0; i < move.length; i++) {
            checkMoveAndMark(move[i][0], move[i][1], move[i][2]);
        }
    };
    
    var pieceSelect = function(event) {
        if (event.target.className.indexOf('oppoPiece') > -1) {
            return;
        }
        
        event.stopPropagation(); // prevent event on board
        
        if (selected) {
            selected.style["background-color"] = '';
        }
        selected = event.target;
        selected.style['background-color'] = 'rgba(255, 255, 0, 0.75)';
        
        markAvailable();
    };

    var moveSelected = function(newPosClass) {
        var newPosNum, oldPosClass, oldPosNum;
        
        newPosNum = convertPosClassToNum(newPosClass);
        board.setPiece(newPosNum[0], newPosNum[1], selected.getAttribute('data-piece'), true);

        oldPosClass = getPosClassFromElement(selected);
        oldPosNum = convertPosClassToNum(oldPosClass);
        board.removePiece(oldPosNum[0], oldPosNum[1]);

        selected.setAttribute('class', 'piece ' + newPosClass);
        selected.style["background-color"] = '';
        selected = null;
        
        board.debug();
    };

    var placeSelect = function(event) {
        var posClass;
        
        if (!selected) {
            return;
        }
        
        if (selected.parentElement.className === 'mochi') {
            // Keep left-most piece of same kind without 'overwrap'
            if (selected.nextElementSibling) {
                var thisHasWrap = selected.className.indexOf('overwrap') > -1 ? true : false;
                var nextHasWrap = selected.nextElementSibling.className.indexOf('overwrap') > -1 ? true : false;
                if (!thisHasWrap && nextHasWrap) {
                    selected.nextSibling.setAttribute('class', 'piece');
                }
            }
            // Move selected to Set area from Mochigoma
            set.appendChild(selected);
        }

        posClass = getPosClassFromCoordinate(event);
        moveSelected(posClass);
    };
    
    var attackSelect = function(event) {
        var moveToMochigoma = function(target) {
            var myMochi, targetSrc, inserted;

            myMochi = document.querySelector("#myMochi");
            target.setAttribute('class', 'piece');

            if (myMochi.children) {
                // Put same kind of pieces on top of existing pieces
                targetSrc = target.getAttribute('src');

                for (var i = 0; i < myMochi.children.length; i++) {
                    if (myMochi.children[i].getAttribute('src') === targetSrc) {
                        inserted = myMochi.insertBefore(target, myMochi.children[i+1]);
                        inserted.setAttribute('class', 'piece overwrap');
                    }
                }
            }
            if (!inserted) {
                // Put new kind of piece next to existing one or at the beginning
                myMochi.appendChild(target);
            }
        };

        var posClass;
        
        if (!selected || selected.parentElement.className === 'mochi') {
            return;
        }
        
        posClass = getPosClassFromElement(event.target);
        moveSelected(posClass);
        moveToMochigoma(event.target);        
    };
    
    var main = function () {
        var setInitialPieces = function() {
            var classAttr, srcPath, img, posNum;

            for (var i = 0; i < def.init.length; i++) {
                img = document.createElement('img');

                srcPath = 'svg/' +  def.init[i].piece + '.svg';

                classAttr = 'piece' + ' ' + def.init[i].pos;
                if (def.init[i].mine === false) {
                    classAttr += ' oppoPiece';
                }

                img.setAttribute('src', srcPath);
                img.setAttribute('class', classAttr);
                img.setAttribute('data-piece', def.init[i].piece);
                img.addEventListener('click', pieceSelect);
                set.appendChild(img);

                posNum = convertPosClassToNum(def.init[i].pos);
                board.setPiece(posNum[0], posNum[1], def.init[i].piece, def.init[i].mine);
            }
        };

        set = document.querySelector("#set");
        set.addEventListener('click', function(event) {
            if (event.target.id === 'board') {
                placeSelect(event);
            } else if (event.target.className.indexOf('oppoPiece') > -1) {
                attackSelect(event);
            } else {
                pieceSelect(event);
            }
        });

        setInitialPieces();
    };
    
    this.main = main;

}).call(this);
