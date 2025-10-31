const { useState } = React;

function Square({ value, onSquareClick, highlight }) {
    return (
        <button className={highlight ? 'square highlight' : 'square'} onClick={onSquareClick}>
            {value}
        </button>
    );
}

function Board({ xIsNext, squares, onPlay, winningLine }) {
    function handleClick(i) {
        if (squares[i] || calculateWinner(squares).winner) return;
        const nextSquares = squares.slice();
        nextSquares[i] = xIsNext ? 'X' : 'O';
        onPlay(nextSquares);
    }

    const status = getStatus(xIsNext, squares);

    function renderSquare(i) {
        const highlight = winningLine && winningLine.includes(i);
        return (
            <Square
                key={i}
                value={squares[i]}
                onSquareClick={() => handleClick(i)}
                highlight={highlight}
            />
        );
    }

    const rows = [0, 1, 2].map((r) => (
        <div className="board-row" key={r}>
            {[0, 1, 2].map((c) => renderSquare(r * 3 + c))}
        </div>
    ));

    return (
        <>
            <div className="status">{status}</div>
            {rows}
        </>
    );
}

function App() {
    const [history, setHistory] = useState([Array(9).fill(null)]);
    const [currentMove, setCurrentMove] = useState(0);
    const xIsNext = currentMove % 2 === 0;
    const currentSquares = history[currentMove];
    const { winner, line } = calculateWinner(currentSquares);

    function handlePlay(nextSquares) {
        const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
        setHistory(nextHistory);
        setCurrentMove(nextHistory.length - 1);
    }

    function jumpTo(nextMove) {
        setCurrentMove(nextMove);
    }

    const moves = history.map((squares, move) => {
        let description;
        if (move === currentMove) {
            description = `Estás en el movimiento #${move}`;
        } else if (move > 0) {
            description = `Ir al movimiento #${move}`;
        } else {
            description = 'Ir al inicio del juego';
        }
        return (
            <li key={move}>
                {move === currentMove ? (
                    <span className="current-move">{description}</span>
                ) : (
                    <button onClick={() => jumpTo(move)}>{description}</button>
                )}
            </li>
        );
    });

    return (
        <div className="game">
            <div className="game-board">
                <Board
                    xIsNext={xIsNext}
                    squares={currentSquares}
                    onPlay={handlePlay}
                    winningLine={line}
                />
                {winner && <div className="winner">¡Ganador: {winner}!</div>}
            </div>
            <div className="game-info">
                <ol>{moves}</ol>
            </div>
        </div>
    );
}

function getStatus(xIsNext, squares) {
    const { winner } = calculateWinner(squares);
    if (winner) {
        return 'Ganador: ' + winner;
    } else if (squares.every(Boolean)) {
        return '¡Empate!';
    } else {
        return 'Siguiente jugador: ' + (xIsNext ? 'X' : 'O');
    }
}

function calculateWinner(squares) {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return { winner: squares[a], line: lines[i] };
        }
    }
    return { winner: null, line: null };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
