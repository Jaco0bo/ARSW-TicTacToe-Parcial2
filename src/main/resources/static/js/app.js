const { useState, useRef, useEffect } = React;
const REST_BASE = 'http://localhost:8080/api';
const WS_ENDPOINT = 'http://localhost:8080/ws';

function Square({ value, onSquareClick, highlight }) {
    return (
        <button className={highlight ? 'square highlight' : 'square'} onClick={onSquareClick}>
            {value}
        </button>
    );
}

function Board({ xIsNext, squares, onPlay, onPlayMultiplayer, winningLine, multiplayer }) {
  function handleClick(i) {
    if (multiplayer) {
      if (squares[i] || calculateWinner(squares).winner) return;
      onPlayMultiplayer?.(i);
      return;
    }
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

  const [multiplayer, setMultiplayer] = useState(false);
  const [roomId, setRoomId] = useState(null);
  const [role, setRole] = useState(null);
  const [serverState, setServerState] = useState(null);
  const stompRef = useRef(null);

  const xIsNext = multiplayer ? serverState?.next === 'X' : currentMove % 2 === 0;
  const currentSquares = multiplayer ? (serverState?.squares ?? Array(9).fill(null)) : history[currentMove];
  const { winner, line } = calculateWinner(currentSquares);

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }
  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  async function createRoom() {
    const res = await fetch(`${REST_BASE}/rooms`, { method: 'POST' });
    if (!res.ok) { console.error('createRoom failed', res.status); return; }
    const state = await res.json();
    if (!state.roomId) { console.error('No roomId in response', state); return; }
    setRoomId(state.roomId);
    setServerState(state);

    const j = await fetch(`${REST_BASE}/rooms/${state.roomId}/join`, { method: 'POST' });
    if (!j.ok) { console.error('join failed', j.status); return; }
    const data = await j.json();
    setRole(data.role);
    setMultiplayer(true);
  }

  async function joinRoom(idFromUser) {
    const id = (idFromUser ?? '').trim();
    if (!id || id.toLowerCase() === 'null' || id.toLowerCase() === 'undefined') {
      alert('Room ID inválido'); return;
    }
    const j = await fetch(`${REST_BASE}/rooms/${id}/join`, { method: 'POST' });
    if (!j.ok) { console.error('join failed', j.status); return; }
    const data = await j.json();
    setRoomId(data.roomId);
    setRole(data.role);
    setMultiplayer(true);
  }

  function joinRoomFlow() {
    const id = prompt('Ingresa el Room ID:');
    if (id) joinRoom(id);
  }

  useEffect(() => {
    if (!multiplayer || !roomId) return;

    if (!window.SockJS || !window.StompJs) {
      alert('Faltan librerías SockJS/STOMP en index.html');
      return;
    }

    const client = new StompJs.Client({
      webSocketFactory: () => new SockJS(WS_ENDPOINT),
      reconnectDelay: 1000,
    });

    client.onConnect = () => {
      client.subscribe(`/topic/rooms/${roomId}`, (msg) => {
        const state = JSON.parse(msg.body); // GameState desde el servidor
        setServerState(state);
      });
    };

    client.onStompError = (frame) => {
      console.error('Broker error:', frame.headers['message'], frame.body);
    };

    client.activate();
    stompRef.current = client;

    return () => {
      stompRef.current?.deactivate();
      stompRef.current = null;
    };
  }, [multiplayer, roomId]);

  function sendMove(index) {
    if (!stompRef.current || !roomId || !role) return;
    stompRef.current.publish({
      destination: '/app/move',
      body: JSON.stringify({ roomId, player: role, index }),
    });
  }

  function Toolbar() {
    return (
        <div style={{display:'flex', gap:8, margin:'10px 0', flexWrap:'wrap'}}>
          {!multiplayer ? (
              <>
                <button onClick={createRoom}>Crear sala (WS)</button>
                <button onClick={joinRoomFlow}>Unirme a sala (WS)</button>
              </>
          ) : (
              <>
                <span><b>Sala:</b> {roomId}</span>
                <span><b>Rol:</b> {role ?? '-'}</span>
                <button onClick={()=>{
                  setMultiplayer(false);
                  setRoomId(null);
                  setRole(null);
                  setServerState(null);
                  setHistory([Array(9).fill(null)]);
                  setCurrentMove(0);
                }}>Salir de sala</button>
              </>
          )}
        </div>
    );
  }

  const moves = !multiplayer ? (
      history.map((squares, move) => {
        let description;
        if (move === currentMove) description = `Estás en el movimiento #${move}`;
        else if (move > 0) description = `Ir al movimiento #${move}`;
        else description = 'Ir al inicio del juego';

        return (
            <li key={move}>
              {move === currentMove ? (
                  <span className="current-move">{description}</span>
              ) : (
                  <button onClick={() => jumpTo(move)}>{description}</button>
              )}
            </li>
        );
      })
  ) : (
      <li style={{ listStyle:'none', color:'#666' }}>Modo multijugador: historial local deshabilitado</li>
  );

  return (
      <div className="game">
        <div style={{gridColumn:'1 / -1'}}>
          <Toolbar />
        </div>

        <div className="game-board">
          <Board
              xIsNext={xIsNext}
              squares={currentSquares}
              onPlay={handlePlay}
              onPlayMultiplayer={sendMove}
              winningLine={line}
              multiplayer={multiplayer}
          />
          {winner && <div className="winner">¡Ganador: {winner}!</div>}
          {multiplayer && !winner && serverState?.over && (
              <div className="winner">¡Empate!</div>
          )}
        </div>

        <div className="game-info">
          <ol>{moves}</ol>
          {multiplayer && (
              <div style={{marginTop:10, fontSize:12, color:'#666'}}>
                Esperando jugadas en tiempo real desde el servidor…
              </div>
          )}
        </div>
      </div>
  );
}

function getStatus(xIsNext, squares) {
  const { winner } = calculateWinner(squares);
  if (winner) return 'Ganador: ' + winner;
  else if (squares.every(Boolean)) return '¡Empate!';
  else return 'Siguiente jugador: ' + (xIsNext ? 'X' : 'O');
}

function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],[3, 4, 5],[6, 7, 8],
    [0, 3, 6],[1, 4, 7],[2, 5, 8],
    [0, 4, 8],[2, 4, 6],
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

