<script lang="ts">
	type Player = 'X' | 'O';
	type Cell = Player | null;

	let board = $state<Cell[]>(Array(9).fill(null));
	let currentPlayer = $state<Player>('X');
	let winner = $state<Player | 'draw' | null>(null);
	let scores = $state({ X: 0, O: 0, draws: 0 });
	let winningLine = $state<number[] | null>(null);

	const LINES = [
		[0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
		[0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
		[0, 4, 8], [2, 4, 6],             // diagonals
	];

	function checkWinner(b: Cell[]): { winner: Player; line: number[] } | 'draw' | null {
		for (const line of LINES) {
			const [i, j, k] = line;
			if (b[i] && b[i] === b[j] && b[i] === b[k]) {
				return { winner: b[i] as Player, line };
			}
		}
		return b.every(Boolean) ? 'draw' : null;
	}

	function handleClick(idx: number) {
		if (board[idx] || winner) return;

		board[idx] = currentPlayer;
		const result = checkWinner(board);

		if (result === 'draw') {
			winner = 'draw';
			scores.draws++;
		} else if (result) {
			winner = result.winner;
			winningLine = result.line;
			scores[result.winner]++;
		} else {
			currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
		}
	}

	function reset() {
		board = Array(9).fill(null);
		winner = null;
		winningLine = null;
		// alternate starting player after each game
		currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
	}

	function fullReset() {
		scores = { X: 0, O: 0, draws: 0 };
		board = Array(9).fill(null);
		winner = null;
		winningLine = null;
		currentPlayer = 'X';
	}

	const statusText = $derived(
		winner === 'draw'
			? "It's a draw"
			: winner
				? `${winner} wins`
				: `${currentPlayer}'s turn`
	);
</script>

<svelte:head>
	<title>Tic Tac Toe — Open Games</title>
	<meta name="description" content="Classic Tic Tac Toe for two players. Play on any device, no setup required." />
</svelte:head>

<div class="page page-enter">
	<nav>
		<a href="/" class="back">← Open Games</a>
	</nav>

	<h1 class="title">Tic Tac Toe</h1>

	<div class="scoreboard" role="status" aria-live="polite">
		<div class="score-item">
			<span class="score-label">X</span>
			<span class="score-val">{scores.X}</span>
		</div>
		<div class="score-divider">
			<span class="score-label">Draws</span>
			<span class="score-val">{scores.draws}</span>
		</div>
		<div class="score-item">
			<span class="score-label">O</span>
			<span class="score-val">{scores.O}</span>
		</div>
	</div>

	<div class="status-row" aria-live="polite">
		<span class="status" class:win={!!winner && winner !== 'draw'} class:draw={winner === 'draw'}>
			{statusText}
		</span>
	</div>

	<div class="board" class:locked={!!winner} role="grid" aria-label="Tic Tac Toe board">
		{#each board as cell, idx}
			<button
				class="cell"
				class:x={cell === 'X'}
				class:o={cell === 'O'}
				class:winning={winningLine?.includes(idx)}
				disabled={!!cell || !!winner}
				onclick={() => handleClick(idx)}
				aria-label="Cell {idx + 1}{cell ? `, marked ${cell}` : ', empty'}"
			>
				{#if cell}
					<span class="mark" aria-hidden="true">{cell}</span>
				{/if}
			</button>
		{/each}
	</div>

	<div class="actions">
		<button class="btn-primary" onclick={reset}>New Game</button>
		<button class="btn-ghost" onclick={fullReset}>Reset Scores</button>
	</div>
</div>

<style>
	.page {
		max-width: 480px;
		margin: 0 auto;
		padding: 2rem 1.5rem 5rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	/* ── Nav ── */
	nav {
		width: 100%;
		margin-bottom: 2rem;
	}

	.back {
		font-size: 0.8125rem;
		color: var(--gray-500);
		letter-spacing: 0.02em;
		transition: color 0.12s ease;
	}

	.back:hover { color: var(--gray-300); }

	/* ── Title ── */
	.title {
		font-size: clamp(1.25rem, 3vw, 1.75rem);
		font-weight: 500;
		letter-spacing: -0.03em;
		color: var(--white);
		margin-bottom: 2rem;
		align-self: flex-start;
	}

	/* ── Scoreboard ── */
	.scoreboard {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		width: 100%;
		padding: 1rem 1.5rem;
		border: 1px solid var(--gray-800);
		border-radius: var(--radius);
		margin-bottom: 1.5rem;
		background: var(--gray-950);
	}

	.score-item,
	.score-divider {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.2rem;
	}

	.score-label {
		font-size: 0.65rem;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--gray-500);
	}

	.score-val {
		font-size: 1.5rem;
		font-weight: 300;
		color: var(--white);
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	/* ── Status ── */
	.status-row {
		height: 1.75rem;
		display: flex;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.status {
		font-size: 0.8125rem;
		color: var(--gray-500);
		letter-spacing: 0.04em;
		text-transform: uppercase;
		transition: color 0.2s ease;
	}

	.status.win  { color: var(--white); font-weight: 500; }
	.status.draw { color: var(--gray-400); }

	/* ── Board ── */
	.board {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1px;
		background: var(--gray-800);
		border: 1px solid var(--gray-800);
		border-radius: var(--radius);
		overflow: hidden;
		width: 100%;
		max-width: 360px;
	}

	.board.locked { cursor: not-allowed; }

	.cell {
		aspect-ratio: 1;
		background: var(--gray-950);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: clamp(1.75rem, 8vw, 2.5rem);
		cursor: pointer;
		transition: background 0.1s ease;
		position: relative;
	}

	.cell:hover:not(:disabled) {
		background: var(--gray-900);
	}

	.cell:disabled {
		cursor: default;
	}

	.cell.winning {
		background: var(--gray-900);
	}

	.mark {
		display: block;
		line-height: 1;
		font-weight: 300;
	}

	.cell.x .mark { color: var(--white); }
	.cell.o .mark { color: var(--gray-400); }

	.cell.winning .mark {
		color: var(--white) !important;
	}

	/* ── Actions ── */
	.actions {
		margin-top: 2rem;
		display: flex;
		gap: 0.75rem;
		align-items: center;
	}

	.btn-primary {
		padding: 0.6rem 1.5rem;
		background: var(--white);
		color: var(--black);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		letter-spacing: 0.01em;
		transition: opacity 0.15s ease;
	}

	.btn-primary:hover { opacity: 0.85; }

	.btn-ghost {
		padding: 0.6rem 1rem;
		border: 1px solid var(--gray-800);
		color: var(--gray-500);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		letter-spacing: 0.01em;
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.btn-ghost:hover {
		border-color: var(--gray-700);
		color: var(--gray-300);
	}
</style>
